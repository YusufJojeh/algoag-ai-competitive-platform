<?php

namespace App\Jobs;

use App\Models\Submission;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Runs an Arena submission through the local judge against the problem's official
 * test cases and persists the verdict + per-case results.
 *
 * Mirrors {@see ProcessCodeforcesSolutionJob}: dispatched by the controller,
 * runs inline under the local `sync` queue, async under the database queue.
 */
class ProcessSubmissionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 300;

    public int $tries = 1;

    public function __construct(public int $submissionId) {}

    public function handle(CodeJudge $judge): void
    {
        $submission = Submission::query()->with('problem.testCases')->find($this->submissionId);
        if (! $submission) {
            return;
        }

        $submission->update([
            'status' => Submission::STATUS_RUNNING,
            'verdict' => 'running',
        ]);

        $problem = $submission->problem;
        $tests = [];
        $limits = [];

        if ($problem) {
            $tests = $problem->testCases
                ->map(fn ($tc) => ['input' => (string) $tc->input, 'expected_output' => (string) $tc->expected_output])
                ->all();
            // Respect the problem's time limit (ms -> whole seconds, min 1s).
            $limits['time_limit_seconds'] = max(1, (int) ceil(((int) $problem->time_limit_ms) / 1000));
        }

        $result = $judge->run((string) $submission->code, (string) $submission->language, $tests, $limits);

        [$verdict, $runtimeMs, $perCase] = $this->summarize($result);

        $submission->update([
            'status' => Submission::STATUS_COMPLETED,
            'verdict' => $verdict,
            'runtime_ms' => $runtimeMs,
            'per_case_results' => $perCase,
            'judge_meta' => [
                'engine' => $result->engine,
                'message' => $result->message,
            ],
        ]);
    }

    /**
     * Derive the overall verdict, runtime, and sanitized per-case list (no test
     * I/O) from a judge result.
     *
     * @return array{0: string, 1: ?int, 2: array<int, array<string, mixed>>}
     */
    private function summarize(VerificationRunResult $result): array
    {
        if (! $result->executed) {
            // The stub judge (default when JUDGE_USE_REAL=false) never executes code;
            // record it honestly rather than as a failure.
            if ($result->engine === 'stub') {
                return ['stub_reviewed', null, []];
            }

            // Map the "could not run" reason to a meaningful top-level verdict.
            $message = strtolower($result->message);
            $verdict = match (true) {
                str_contains($message, 'no test cases') => 'no_tests',
                str_contains($message, 'not supported') => 'unsupported_language',
                default => 'internal_error',
            };

            return [$verdict, null, []];
        }

        $overall = 'accepted';
        $runtimeMs = 0;
        $perCase = [];

        foreach ($result->testCases as $tc) {
            $caseVerdict = (string) ($tc['verdict'] ?? 'internal_error');
            $caseRuntime = (int) ($tc['runtime_ms'] ?? 0);
            $runtimeMs = max($runtimeMs, $caseRuntime);

            if ($caseVerdict !== 'accepted' && $overall === 'accepted') {
                $overall = $caseVerdict;
            }

            // Store only index/verdict/runtime — never test input/expected/stdout.
            $perCase[] = [
                'index' => (int) ($tc['index'] ?? count($perCase)),
                'verdict' => $caseVerdict,
                'runtime_ms' => $caseRuntime,
            ];
        }

        return [$overall, $runtimeMs, $perCase];
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('ProcessSubmissionJob failed', [
            'submission_id' => $this->submissionId,
        ]);

        $submission = Submission::query()->find($this->submissionId);
        if ($submission) {
            $submission->update([
                'status' => Submission::STATUS_COMPLETED,
                'verdict' => 'internal_error',
                'judge_meta' => [
                    'engine' => 'local_process',
                    'message' => 'تعذر تنفيذ الحكم. حاول مرة أخرى.',
                ],
            ]);
        }
    }
}
