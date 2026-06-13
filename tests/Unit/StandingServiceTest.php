<?php

namespace Tests\Unit;

use App\Models\Submission;
use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Arena\Services\StandingService;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StandingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_ranks_by_solved_then_penalty(): void
    {
        $contest = Contest::factory()->create(['starts_at' => now()->subHours(3), 'ends_at' => now()->addHour()]);
        $problem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $fast = User::factory()->create(['name' => 'Fast']);
        $slow = User::factory()->create(['name' => 'Slow']);

        // Fast: AC after 10 minutes, no wrong attempts.
        Submission::factory()->create([
            'user_id' => $fast->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'accepted', 'created_at' => $contest->starts_at->copy()->addMinutes(10),
        ]);

        // Slow: one wrong attempt, then AC after 30 minutes (penalty 30 + 20 = 50).
        Submission::factory()->create([
            'user_id' => $slow->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'wrong_answer', 'created_at' => $contest->starts_at->copy()->addMinutes(5),
        ]);
        Submission::factory()->create([
            'user_id' => $slow->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'accepted', 'created_at' => $contest->starts_at->copy()->addMinutes(30),
        ]);

        $rows = (new StandingService())->standingsFor($contest);

        $this->assertCount(2, $rows);
        $this->assertSame('Fast', $rows[0]['user_name']);
        $this->assertSame(1, $rows[0]['rank']);
        $this->assertSame(10, $rows[0]['penalty']);
        $this->assertSame('Slow', $rows[1]['user_name']);
        $this->assertSame(50, $rows[1]['penalty']);
    }

    public function test_empty_contest_has_no_rows(): void
    {
        $contest = Contest::factory()->create();

        $this->assertSame([], (new StandingService())->standingsFor($contest));
    }

    public function test_only_counts_submissions_from_the_same_contest(): void
    {
        $contest = Contest::factory()->create(['starts_at' => now()->subHours(2), 'ends_at' => now()->addHour()]);
        $other = Contest::factory()->create(['starts_at' => now()->subHours(2), 'ends_at' => now()->addHour()]);
        $problem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $other->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $user = User::factory()->create(['name' => 'Solo']);

        // AC in OTHER contest must not appear in this contest's standings.
        Submission::factory()->create([
            'user_id' => $user->id, 'problem_id' => $problem->id, 'contest_id' => $other->id,
            'verdict' => 'accepted', 'created_at' => $contest->starts_at->copy()->addMinutes(5),
        ]);

        $this->assertSame([], (new StandingService())->standingsFor($contest));

        // AC in THIS contest counts.
        Submission::factory()->create([
            'user_id' => $user->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'accepted', 'created_at' => $contest->starts_at->copy()->addMinutes(5),
        ]);

        $rows = (new StandingService())->standingsFor($contest);
        $this->assertCount(1, $rows);
        $this->assertSame(1, $rows[0]['solved']);
    }

    public function test_wrong_answer_after_ac_does_not_add_penalty(): void
    {
        $contest = Contest::factory()->create(['starts_at' => now()->subHours(2), 'ends_at' => now()->addHour()]);
        $problem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $user = User::factory()->create(['name' => 'Solver']);

        // AC at +10 min (penalty 10), then a later WA that must be ignored.
        Submission::factory()->create([
            'user_id' => $user->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'accepted', 'created_at' => $contest->starts_at->copy()->addMinutes(10),
        ]);
        Submission::factory()->create([
            'user_id' => $user->id, 'problem_id' => $problem->id, 'contest_id' => $contest->id,
            'verdict' => 'wrong_answer', 'created_at' => $contest->starts_at->copy()->addMinutes(40),
        ]);

        $rows = (new StandingService())->standingsFor($contest);
        $this->assertSame(1, $rows[0]['solved']);
        $this->assertSame(10, $rows[0]['penalty']);
    }
}
