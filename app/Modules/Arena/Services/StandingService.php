<?php

namespace App\Modules\Arena\Services;

use App\Models\Submission;
use App\Modules\Arena\Models\Contest;
use Illuminate\Support\Collection;

/**
 * Computes ICPC-style standings for a contest from its submissions.
 *
 * Scoring:
 *  - A problem counts as solved on the first accepted submission.
 *  - Penalty for a solved problem = minutes from contest start to that AC
 *    + {@see self::WRONG_PENALTY_MINUTES} per rejected attempt made before the AC.
 *  - Rank by problems solved (desc), then total penalty (asc).
 */
class StandingService
{
    public const WRONG_PENALTY_MINUTES = 20;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function standingsFor(Contest $contest): array
    {
        $problemIds = $contest->problems()->pluck('problems.id')->all();
        if ($problemIds === []) {
            return [];
        }

        $start = $contest->starts_at;

        $submissions = Submission::query()
            ->where('contest_id', $contest->id)
            ->whereIn('problem_id', $problemIds)
            ->with('user:id,name')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        /** @var Collection<int, array<string, mixed>> $rows keyed by user_id */
        $rows = collect();

        foreach ($submissions as $submission) {
            $userId = (int) $submission->user_id;
            $problemId = (int) $submission->problem_id;

            $row = $rows->get($userId, [
                'user_id' => $userId,
                'user_name' => $submission->user?->name ?? 'Unknown',
                'solved' => 0,
                'penalty' => 0,
                'problems' => [],
            ]);

            $state = $row['problems'][$problemId] ?? ['accepted' => false, 'wrong' => 0];

            // Ignore further submissions to an already-solved problem.
            if (! $state['accepted']) {
                if ($submission->verdict === 'accepted') {
                    $state['accepted'] = true;
                    $minutes = $start ? (int) max(0, $start->diffInMinutes($submission->created_at)) : 0;
                    $row['solved']++;
                    $row['penalty'] += $minutes + ($state['wrong'] * self::WRONG_PENALTY_MINUTES);
                } elseif ($this->isRejected($submission->verdict)) {
                    $state['wrong']++;
                }
            }

            $row['problems'][$problemId] = $state;
            $rows->put($userId, $row);
        }

        return $rows
            ->sortBy([
                ['solved', 'desc'],
                ['penalty', 'asc'],
                ['user_name', 'asc'],
            ])
            ->values()
            ->map(function (array $row, int $index) {
                $row['rank'] = $index + 1;

                return $row;
            })
            ->all();
    }

    /**
     * Pending/running/queued attempts do not incur penalty; only real rejections do.
     */
    private function isRejected(string $verdict): bool
    {
        return in_array($verdict, [
            'wrong_answer',
            'time_limit_exceeded',
            'runtime_error',
            'compilation_error',
        ], true);
    }
}
