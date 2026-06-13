<?php

namespace App\Jobs;

use App\Models\CodeforcesSolution;
use App\Services\AI\AiUsageService;
use App\Services\CodeforcesSolverService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCodeforcesSolutionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 900;

    public int $tries = 2;

    public function __construct(public int $solutionId) {}

    public function handle(CodeforcesSolverService $solver): void
    {
        $solver->runPipeline($this->solutionId);
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('ProcessCodeforcesSolutionJob failed', [
            'solution_id' => $this->solutionId,
            'failure_category' => 'job_failed',
        ]);

        $solution = CodeforcesSolution::query()->find($this->solutionId);
        if ($solution) {
            $solution->update([
                'status' => CodeforcesSolution::STATUS_FAILED,
                'progress_stage' => CodeforcesSolution::STAGE_FAILED,
                'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
            ]);
            [$provider, $model] = $this->providerSnapshot();
            app(AiUsageService::class)->record(
                $solution->user_id,
                AiUsageService::FEATURE_CODEFORCES_SOLVE,
                'failed',
                $provider,
                $model,
                null,
                null,
                'job_failed',
            );
        }
    }

    /**
     * Match PrimaryTextGenerator provider selection without making a network call.
     *
     * @return array{0: string, 1: string}
     */
    private function providerSnapshot(): array
    {
        $primary = strtolower((string) config('services.ai.primary', 'openai'));
        if ($primary === 'openai' && (string) config('services.ai.openai.api_key', '') !== '') {
            return ['openai', (string) config('services.ai.openai.model', 'gpt-4o')];
        }

        return ['ollama', (string) config('services.ollama.model')];
    }
}
