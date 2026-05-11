<?php

namespace App\Jobs;

use App\Models\CodeforcesSolution;
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
        // Log full details server-side only; never expose exception internals to users.
        Log::error('ProcessCodeforcesSolutionJob failed', [
            'solution_id' => $this->solutionId,
            'message' => $exception?->getMessage(),
            'trace' => $exception?->getTraceAsString(),
        ]);

        $solution = CodeforcesSolution::query()->find($this->solutionId);
        if ($solution) {
            $solution->update([
                'status' => CodeforcesSolution::STATUS_FAILED,
                'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
            ]);
        }
    }
}
