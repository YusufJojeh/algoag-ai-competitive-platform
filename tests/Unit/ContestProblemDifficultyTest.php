<?php

namespace Tests\Unit;

use App\Models\Submission;
use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Arena\Services\PublishEndedContestProblemsService;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContestProblemDifficultyTest extends TestCase
{
    use RefreshDatabase;

    public function test_zero_participants_is_extreme(): void
    {
        [$contest, $problem] = $this->contestWithProblem();

        $this->assertSame('extreme', $this->service()->difficultyFor($contest, $problem));
    }

    public function test_no_accepted_solvers_is_extreme_and_wrong_answers_do_not_count(): void
    {
        [$contest, $problem] = $this->contestWithProblem();
        $user = $this->join($contest);
        Submission::factory()->create([
            'user_id' => $user->id,
            'problem_id' => $problem->id,
            'contest_id' => $contest->id,
            'verdict' => 'wrong_answer',
            'created_at' => $contest->starts_at->copy()->addMinutes(5),
        ]);

        $this->assertSame('extreme', $this->service()->difficultyFor($contest, $problem));
    }

    public function test_high_solve_rate_low_median_is_easy(): void
    {
        [$contest, $problem] = $this->contestWithProblem();
        $users = collect(range(1, 4))->map(fn () => $this->join($contest));
        $this->accept($contest, $problem, $users[0], 8);
        $this->accept($contest, $problem, $users[1], 12);
        $this->accept($contest, $problem, $users[2], 16);

        $this->assertSame('easy', $this->service()->difficultyFor($contest, $problem));
    }

    public function test_medium_solve_rate_reasonable_median_is_medium(): void
    {
        [$contest, $problem] = $this->contestWithProblem();
        $users = collect(range(1, 5))->map(fn () => $this->join($contest));
        $this->accept($contest, $problem, $users[0], 30);
        $this->accept($contest, $problem, $users[1], 40);

        $this->assertSame('medium', $this->service()->difficultyFor($contest, $problem));
    }

    public function test_low_solve_rate_or_median_can_be_hard_and_everything_else_extreme(): void
    {
        [$hardContest, $hardProblem] = $this->contestWithProblem();
        $hardUsers = collect(range(1, 10))->map(fn () => $this->join($hardContest));
        $this->accept($hardContest, $hardProblem, $hardUsers[0], 85);
        $this->accept($hardContest, $hardProblem, $hardUsers[1], 88);

        $this->assertSame('hard', $this->service()->difficultyFor($hardContest, $hardProblem));

        [$extremeContest, $extremeProblem] = $this->contestWithProblem();
        $extremeUsers = collect(range(1, 10))->map(fn () => $this->join($extremeContest));
        $this->accept($extremeContest, $extremeProblem, $extremeUsers[0], 120);

        $this->assertSame('extreme', $this->service()->difficultyFor($extremeContest, $extremeProblem));
    }

    public function test_small_sample_cannot_be_easy(): void
    {
        [$contest, $problem] = $this->contestWithProblem();
        $users = collect(range(1, 2))->map(fn () => $this->join($contest));
        $this->accept($contest, $problem, $users[0], 5);
        $this->accept($contest, $problem, $users[1], 6);

        $this->assertSame('medium', $this->service()->difficultyFor($contest, $problem));
    }

    public function test_only_first_accepted_per_user_counts(): void
    {
        [$contest, $problem] = $this->contestWithProblem();
        $users = collect(range(1, 4))->map(fn () => $this->join($contest));
        $this->accept($contest, $problem, $users[0], 10);
        $this->accept($contest, $problem, $users[0], 100);
        $this->accept($contest, $problem, $users[1], 12);
        $this->accept($contest, $problem, $users[2], 14);

        $this->assertSame('easy', $this->service()->difficultyFor($contest, $problem));
    }

    private function service(): PublishEndedContestProblemsService
    {
        return app(PublishEndedContestProblemsService::class);
    }

    private function contestWithProblem(): array
    {
        $contest = Contest::factory()->ended()->create([
            'starts_at' => now()->subHours(3),
            'ends_at' => now()->subHour(),
        ]);
        $problem = Problem::factory()->contestOnly()->create([
            'published_from_contest_id' => $contest->id,
        ]);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        return [$contest, $problem];
    }

    private function join(Contest $contest): User
    {
        $user = User::factory()->create();
        $contest->participants()->attach($user->id, ['registered_at' => $contest->starts_at]);

        return $user;
    }

    private function accept(Contest $contest, Problem $problem, User $user, int $minute): void
    {
        Submission::factory()->create([
            'user_id' => $user->id,
            'problem_id' => $problem->id,
            'contest_id' => $contest->id,
            'verdict' => 'accepted',
            'created_at' => $contest->starts_at->copy()->addMinutes($minute),
        ]);
    }
}
