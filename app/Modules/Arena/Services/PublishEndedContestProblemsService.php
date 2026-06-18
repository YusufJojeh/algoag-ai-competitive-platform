<?php

namespace App\Modules\Arena\Services;

use App\Models\Submission;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Support\Facades\DB;

class PublishEndedContestProblemsService
{
    /**
     * @return array{contests_scanned: int, problems_published: int, difficulty_counts: array<string, int>}
     */
    public function publishEndedContests(): array
    {
        $summary = [
            'contests_scanned' => 0,
            'problems_published' => 0,
            'difficulty_counts' => [
                'easy' => 0,
                'medium' => 0,
                'hard' => 0,
                'extreme' => 0,
            ],
        ];

        Contest::query()
            ->where('is_practice', false)
            ->whereNull('problems_published_at')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->whereHas('problems', fn ($query) => $query
                ->where('problems.is_public', false)
                ->whereNull('problems.published_at')
                ->whereColumn('problems.published_from_contest_id', 'contests.id'))
            ->orderBy('id')
            ->chunkById(50, function ($contests) use (&$summary) {
                foreach ($contests as $contest) {
                    $result = $this->publishContest($contest);
                    $summary['contests_scanned']++;
                    $summary['problems_published'] += $result['problems_published'];

                    foreach ($result['difficulty_counts'] as $difficulty => $count) {
                        $summary['difficulty_counts'][$difficulty] += $count;
                    }
                }
            });

        return $summary;
    }

    /**
     * @return array{problems_published: int, difficulty_counts: array<string, int>}
     */
    public function publishContest(Contest $contest): array
    {
        return DB::transaction(function () use ($contest) {
            $contest = Contest::query()->lockForUpdate()->findOrFail($contest->id);

            $result = [
                'problems_published' => 0,
                'difficulty_counts' => [
                    'easy' => 0,
                    'medium' => 0,
                    'hard' => 0,
                    'extreme' => 0,
                ],
            ];

            if ($contest->is_practice || $contest->problems_published_at !== null || ! $contest->hasEnded()) {
                return $result;
            }

            $problems = $contest->problems()
                ->where('problems.is_public', false)
                ->whereNull('problems.published_at')
                ->where('problems.published_from_contest_id', $contest->id)
                ->get();

            if ($problems->isEmpty()) {
                return $result;
            }

            foreach ($problems as $problem) {
                $difficulty = $this->difficultyFor($contest, $problem);

                $problem->update([
                    'is_public' => true,
                    'published_at' => now(),
                    'difficulty' => $difficulty,
                ]);

                $result['problems_published']++;
                $result['difficulty_counts'][$difficulty]++;
            }

            $contest->update(['problems_published_at' => now()]);

            return $result;
        });
    }

    public function difficultyFor(Contest $contest, Problem $problem): string
    {
        $participants = $contest->participants()
            ->get(['users.id', 'contest_participants.registered_at']);
        $participantsCount = $participants->count();

        if ($participantsCount === 0) {
            return 'extreme';
        }

        $participantIds = $participants->pluck('id')->map(fn ($id) => (int) $id)->all();

        $firstAccepted = Submission::query()
            ->where('contest_id', $contest->id)
            ->where('problem_id', $problem->id)
            ->where('verdict', 'accepted')
            ->whereIn('user_id', $participantIds)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['user_id', 'created_at'])
            ->groupBy('user_id')
            ->map(fn ($submissions) => $submissions->first());

        $acceptedSolversCount = $firstAccepted->count();
        if ($acceptedSolversCount === 0) {
            return 'extreme';
        }

        $registeredAtByUser = $participants->mapWithKeys(fn ($user) => [
            (int) $user->id => $user->pivot?->registered_at,
        ]);

        $solveMinutes = $firstAccepted
            ->map(function (Submission $submission) use ($contest, $registeredAtByUser) {
                $baseline = $contest->starts_at ?? $registeredAtByUser->get((int) $submission->user_id) ?? $submission->created_at;
                if (! $baseline instanceof \Carbon\CarbonInterface) {
                    $baseline = \Carbon\CarbonImmutable::parse($baseline);
                }

                return (int) max(0, $baseline->diffInMinutes($submission->created_at));
            })
            ->sort()
            ->values()
            ->all();

        $solveRate = $acceptedSolversCount / max($participantsCount, 1);
        $medianSolveMinutes = $this->median($solveMinutes);

        $difficulty = match (true) {
            $solveRate >= 0.65 && $medianSolveMinutes <= 20 => 'easy',
            $solveRate >= 0.35 && $medianSolveMinutes <= 45 => 'medium',
            $solveRate >= 0.15 || $medianSolveMinutes <= 90 => 'hard',
            default => 'extreme',
        };

        if ($participantsCount < 3 && $difficulty === 'easy') {
            return 'medium';
        }

        return $difficulty;
    }

    /**
     * @param  array<int, int>  $values
     */
    private function median(array $values): float
    {
        $count = count($values);
        if ($count === 0) {
            return 0.0;
        }

        $middle = intdiv($count, 2);
        if ($count % 2 === 1) {
            return (float) $values[$middle];
        }

        return ($values[$middle - 1] + $values[$middle]) / 2;
    }
}
