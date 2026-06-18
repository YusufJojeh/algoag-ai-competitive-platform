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
    public function handle(int $userId, string $problemText, string $language, string $responseLanguage = 'ar'): array
    {
        if (! in_array($language, ['python', 'cpp'], true)) {
            throw new \InvalidArgumentException('Unsupported Codeforces solution language.');
        }

        $jobUuid = (string) Str::uuid();

        $solution = CodeforcesSolution::create([
            'user_id' => $userId,
            'problem_text' => $problemText,
            'solution_language' => $language,
            'response_language' => $responseLanguage === 'en' ? 'en' : 'ar',
            'status' => CodeforcesSolution::STATUS_PENDING,
            'progress_stage' => CodeforcesSolution::STAGE_QUEUED,
            'job_id' => $jobUuid,
        ]);

        ProcessCodeforcesSolutionJob::dispatch($solution->id);

        return [
            'solution' => $solution,
            'jobUuid' => $jobUuid,
        ];
    }
}
