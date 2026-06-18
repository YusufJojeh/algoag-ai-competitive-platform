<?php

namespace Tests\Feature;

use App\Models\Submission;
use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Arena\Services\PublishEndedContestProblemsService;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishEndedContestProblemsTest extends TestCase
{
    use RefreshDatabase;

    public function test_ended_timed_contest_publishes_private_contest_only_problems(): void
    {
        $contest = Contest::factory()->ended()->create(['starts_at' => now()->subHours(2), 'ends_at' => now()->subHour()]);
        $problem = $this->attachPrivateProblem($contest);
        $users = User::factory()->count(3)->create();
        foreach ($users as $user) {
            $contest->participants()->attach($user->id, ['registered_at' => $contest->starts_at]);
        }
        Submission::factory()->create([
            'user_id' => $users[0]->id,
            'problem_id' => $problem->id,
            'contest_id' => $contest->id,
            'verdict' => 'accepted',
            'created_at' => $contest->starts_at->copy()->addMinutes(10),
        ]);
        Submission::factory()->create([
            'user_id' => $users[1]->id,
            'problem_id' => $problem->id,
            'contest_id' => $contest->id,
            'verdict' => 'accepted',
            'created_at' => $contest->starts_at->copy()->addMinutes(15),
        ]);

        $summary = app(PublishEndedContestProblemsService::class)->publishEndedContests();

        $problem->refresh();
        $this->assertTrue($problem->is_public);
        $this->assertNotNull($problem->published_at);
        $this->assertSame('easy', $problem->difficulty);
        $this->assertNotNull($contest->fresh()->problems_published_at);
        $this->assertSame(1, $summary['problems_published']);
        $this->assertSame(1, $summary['difficulty_counts']['easy']);
    }

    public function test_ended_contest_with_computed_duration_end_time_is_publishable(): void
    {
        $startsAt = now()->subHours(2);
        $contest = Contest::factory()->ended()->create([
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(30),
        ]);
        $problem = $this->attachPrivateProblem($contest);

        $summary = app(PublishEndedContestProblemsService::class)->publishEndedContests();

        $this->assertTrue($problem->fresh()->is_public);
        $this->assertNotNull($contest->fresh()->problems_published_at);
        $this->assertSame(1, $summary['problems_published']);
    }

    public function test_active_not_started_and_practice_contests_do_not_auto_publish(): void
    {
        $running = Contest::factory()->create();
        $upcoming = Contest::factory()->upcoming()->create();
        $practice = Contest::factory()->practice()->create();
        $runningProblem = $this->attachPrivateProblem($running);
        $upcomingProblem = $this->attachPrivateProblem($upcoming);
        $practiceProblem = $this->attachPrivateProblem($practice);

        $summary = app(PublishEndedContestProblemsService::class)->publishEndedContests();

        $this->assertFalse($runningProblem->fresh()->is_public);
        $this->assertFalse($upcomingProblem->fresh()->is_public);
        $this->assertFalse($practiceProblem->fresh()->is_public);
        $this->assertSame(0, $summary['problems_published']);
    }

    public function test_command_is_idempotent_and_sets_publish_marker(): void
    {
        $contest = Contest::factory()->ended()->create();
        $problem = $this->attachPrivateProblem($contest);

        $this->artisan('arena:publish-ended-problems')
            ->expectsOutputToContain('Contests scanned: 1')
            ->expectsOutputToContain('Problems published: 1')
            ->assertSuccessful();

        $this->artisan('arena:publish-ended-problems')
            ->expectsOutputToContain('Contests scanned: 0')
            ->expectsOutputToContain('Problems published: 0')
            ->assertSuccessful();

        $this->assertTrue($problem->fresh()->is_public);
        $this->assertNotNull($contest->fresh()->problems_published_at);
    }

    public function test_already_public_problems_are_not_changed_unnecessarily(): void
    {
        $contest = Contest::factory()->ended()->create();
        $publishedAt = now()->subDays(5);
        $problem = Problem::factory()->create([
            'difficulty' => 'medium',
            'published_at' => $publishedAt,
            'published_from_contest_id' => $contest->id,
        ]);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $privateProblem = $this->attachPrivateProblem($contest);

        $summary = app(PublishEndedContestProblemsService::class)->publishEndedContests();

        $problem->refresh();
        $this->assertSame('medium', $problem->difficulty);
        $this->assertTrue($problem->published_at->isSameSecond($publishedAt));
        $this->assertTrue($privateProblem->fresh()->is_public);
        $this->assertSame(1, $summary['problems_published']);
        $this->assertNotNull($contest->fresh()->problems_published_at);
    }

    public function test_ended_contest_without_private_contest_only_problems_is_not_scanned(): void
    {
        $contest = Contest::factory()->ended()->create();
        $publicProblem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $publicProblem->id, 'label' => 'A', 'ordinal' => 0]);

        $summary = app(PublishEndedContestProblemsService::class)->publishEndedContests();

        $this->assertSame(0, $summary['contests_scanned']);
        $this->assertSame(0, $summary['problems_published']);
        $this->assertNull($contest->fresh()->problems_published_at);
    }

    private function attachPrivateProblem(Contest $contest): Problem
    {
        $problem = Problem::factory()->contestOnly()->create([
            'published_from_contest_id' => $contest->id,
        ]);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        return $problem;
    }
}
