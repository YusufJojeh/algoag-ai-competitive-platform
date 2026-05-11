<?php

namespace App\Services;

use App\Models\CodeforcesSolution;
use App\Models\VerificationRun;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Realtime\Events\CodeforcesSolutionStatusUpdated;
use App\Services\Prompts\CodeforcesPrompts;
use Illuminate\Support\Facades\Log;

class CodeforcesSolverService
{
    /** Timeout per Ollama call in seconds (pipeline has multiple calls). */
    protected int $timeout = 180;

    public function __construct(
        protected OllamaService $ollama,
        protected CodeJudge $judge,
        protected string $solutionModel = CodeforcesSolution::class
    ) {}

    /**
     * Create a solution row and run the full pipeline synchronously (used by tests and tooling).
     * HTTP requests use {@see ProcessCodeforcesSolutionJob} + {@see runPipeline} instead.
     */
    public function solve(string $problem, string $language, ?int $userId = null): CodeforcesSolution
    {
        $language = $language === 'python' ? 'python' : 'cpp';

        /** @var class-string<CodeforcesSolution> $modelClass */
        $modelClass = $this->solutionModel;
        $solution = $modelClass::query()->create([
            'user_id' => $userId,
            'problem_text' => $problem,
            'solution_language' => $language,
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $this->runPipeline($solution->id);

        return $modelClass::query()->findOrFail($solution->id);
    }

    /**
     * Run the full pipeline on an existing row: parse -> code -> explain -> tests -> judge -> algorithm breakdown.
     */
    public function runPipeline(int $solutionId): void
    {
        $solution = ($this->solutionModel)::query()->findOrFail($solutionId);

        try {
            $solution->status = CodeforcesSolution::STATUS_PROCESSING;
            $solution->save();

            $problemText = $solution->problem_text;
            $language = $solution->solution_language ?: 'cpp';

            $solution->parsed_problem = $this->parseProblem($problemText);
            $solution->save();

            $parsedJson = is_array($solution->parsed_problem)
                ? json_encode($solution->parsed_problem, JSON_UNESCAPED_UNICODE)
                : (string) $solution->parsed_problem;

            $solution->solution_code = $this->generateSolution($parsedJson, $language);
            $solution->solution_language = $language === 'python' ? 'python' : 'cpp';
            $solution->save();

            $solution->explanation = $this->generateExplanation($parsedJson, $solution->solution_code);
            $solution->save();

            $solution->generated_tests = $this->generateTests($parsedJson, $solution->solution_code);
            $solution->save();

            $judgeResult = $this->judge->judge($solution);
            $solution->run_results = $judgeResult->toArray();
            $solution->save();

            // Persist structured verification run for academic reporting
            $this->persistVerificationRun($solution, $judgeResult->toArray());

            $solution->algorithm_breakdown = $this->generateAlgorithmBreakdown($parsedJson, $solution->solution_code);
            $solution->status = CodeforcesSolution::STATUS_COMPLETED;
            $solution->error_message = null;
        } catch (\Throwable $e) {
            Log::error('CodeforcesSolverService failed: '.$e->getMessage(), ['solution_id' => $solution->id]);
            $solution->status = CodeforcesSolution::STATUS_FAILED;
            $solution->error_message = 'تعذر إكمال العملية. حاول مرة أخرى.';
        }

        $solution->save();

        $solution->refresh();
        if ($solution->user_id !== null && in_array($solution->status, [CodeforcesSolution::STATUS_COMPLETED, CodeforcesSolution::STATUS_FAILED], true)) {
            broadcast(new CodeforcesSolutionStatusUpdated(
                $solution->id,
                (int) $solution->user_id,
                $solution->status,
                $solution->error_message
            ));
        }
    }

    protected function parseProblem(string $problemText): array
    {
        $system = CodeforcesPrompts::parseProblem();
        $prompt = $system."\n\n<user_content>\n".$problemText."\n</user_content>";
        $response = $this->ollama->generate($prompt, $this->timeout);
        $response = $this->stripJsonFromResponse($response);
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return [
                'title' => '',
                'description' => $problemText,
                'input_format' => '',
                'output_format' => '',
                'constraints' => '',
                'examples' => [],
                'notes' => '',
            ];
        }

        return $decoded;
    }

    protected function generateSolution(string $parsedJson, string $language): string
    {
        $system = CodeforcesPrompts::generateSolution($language);
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>";
        $response = $this->ollama->generate($prompt, $this->timeout);

        return $this->stripCodeBlock($response);
    }

    protected function generateExplanation(string $parsedJson, string $solutionCode): string
    {
        $system = CodeforcesPrompts::generateExplanation();
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";

        return trim($this->ollama->generate($prompt, $this->timeout));
    }

    protected function generateTests(string $parsedJson, string $solutionCode): array
    {
        $system = CodeforcesPrompts::generateTests();
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";
        $response = $this->ollama->generate($prompt, $this->timeout);
        $response = $this->stripJsonFromResponse($response);
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return [];
        }
        $tests = [];
        foreach ($decoded as $t) {
            if (isset($t['input']) && (isset($t['expected_output']) || array_key_exists('expected_output', $t))) {
                $tests[] = [
                    'input' => (string) $t['input'],
                    'expected_output' => (string) ($t['expected_output'] ?? ''),
                ];
            }
        }

        return $tests;
    }

    protected function generateAlgorithmBreakdown(string $parsedJson, string $solutionCode): string
    {
        $system = CodeforcesPrompts::generateAlgorithmBreakdown();
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";

        return trim($this->ollama->generate($prompt, $this->timeout));
    }

    protected function stripJsonFromResponse(string $response): string
    {
        $response = trim($response);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $response, $m)) {
            return trim($m[1]);
        }

        return $response;
    }

    protected function stripCodeBlock(string $response): string
    {
        $response = trim($response);
        if (preg_match('/```(?:\w+)?\s*([\s\S]*?)```/', $response, $m)) {
            return trim($m[1]);
        }

        return $response;
    }

    private function persistVerificationRun(CodeforcesSolution $solution, array $judgeResult): void
    {
        try {
            $testCases = $judgeResult['test_cases'] ?? [];
            $overallVerdict = VerificationRun::VERDICT_NOT_RUN;

            if ($judgeResult['executed'] ?? false) {
                $overallVerdict = VerificationRun::VERDICT_ACCEPTED;
                foreach ($testCases as $tc) {
                    if (($tc['verdict'] ?? '') !== 'accepted') {
                        $overallVerdict = $tc['verdict'];
                        break;
                    }
                }
            }

            $maxRuntimeMs = null;
            foreach ($testCases as $tc) {
                $rt = $tc['runtime_ms'] ?? null;
                if ($rt !== null && ($maxRuntimeMs === null || $rt > $maxRuntimeMs)) {
                    $maxRuntimeMs = $rt;
                }
            }

            VerificationRun::create([
                'codeforces_solution_id' => $solution->id,
                'language' => $solution->solution_language ?? 'python',
                'status' => VerificationRun::STATUS_COMPLETED,
                'verdict' => $overallVerdict,
                'source_code' => $solution->solution_code,
                'tests_json' => $solution->generated_tests,
                'run_results_json' => $testCases,
                'runtime_ms' => $maxRuntimeMs,
                'error_message' => $judgeResult['message'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('verification_run.persist.failed', [
                'solution_id' => $solution->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
