<?php

namespace App\Modules\Codeforces\Actions;

use App\Jobs\ProcessCodeforcesSolutionJob;
use App\Models\CodeforcesSolution;
use Illuminate\Support\Str;

class QueueCodeforcesSolutionAction
{
    /**
     * @return array{solution: CodeforcesSolution, jobUuid: string}
     */
    public function handle(int $userId, string $problemText, string $language): array
    {
        $jobUuid = (string) Str::uuid();

        $solution = CodeforcesSolution::create([
            'user_id' => $userId,
            'problem_text' => $problemText,
            'solution_language' => $language === 'python' ? 'python' : 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
            'job_id' => $jobUuid,
        ]);

        ProcessCodeforcesSolutionJob::dispatch($solution->id)->afterResponse();

        return [
            'solution' => $solution,
            'jobUuid' => $jobUuid,
        ];
    }
}
