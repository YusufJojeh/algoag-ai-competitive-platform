<?php

namespace Tests\Feature;

use App\Jobs\ProcessSubmissionJob;
use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Contest gatekeeping: join-before-submit, timed window, practice anytime, and
 * problem-belongs-to-contest enforcement on POST /submissions.
 */
class ContestSubmissionGateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake(); // gate tests check acceptance/rejection, not the judge itself
    }

    private function contestWithProblem(Contest $contest, ?Problem $problem = null): array
    {
        $problem ??= Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        return [$contest, $problem];
    }

    private function join(Contest $contest, User $user): void
    {
        $contest->participants()->attach($user->id, ['registered_at' => now()]);
    }

    private function submit(User $user, Problem $problem, Contest $contest)
    {
        return $this->actingAs($user)->post('/submissions', [
            'problem_id' => $problem->id,
            'contest_id' => $contest->id,
            'language' => 'python',
            'code' => 'print(1)',
        ]);
    }

    public function test_cannot_submit_to_contest_before_joining(): void
    {
        $user = User::factory()->create();
        [$contest, $problem] = $this->contestWithProblem(Contest::factory()->create());

        $this->submit($user, $problem, $contest)->assertForbidden();

        $this->assertDatabaseCount('submissions', 0);
        Queue::assertNotPushed(ProcessSubmissionJob::class);
    }

    public function test_joined_user_can_submit_to_practice_contest_anytime(): void
    {
        $user = User::factory()->create();
        // Practice contest with null window — would be "not started" if timed.
        [$contest, $problem] = $this->contestWithProblem(Contest::factory()->practice()->create());
        $this->join($contest, $user);

        $this->submit($user, $problem, $contest)->assertRedirect();

        $this->assertDatabaseCount('submissions', 1);
        Queue::assertPushed(ProcessSubmissionJob::class);
    }

    public function test_timed_contest_blocks_submit_before_start(): void
    {
        $user = User::factory()->create();
        [$contest, $problem] = $this->contestWithProblem(Contest::factory()->upcoming()->create());
        $this->join($contest, $user);

        $this->submit($user, $problem, $contest)->assertForbidden();
        $this->assertDatabaseCount('submissions', 0);
    }

    public function test_timed_contest_blocks_submit_after_end(): void
    {
        $user = User::factory()->create();
        [$contest, $problem] = $this->contestWithProblem(Contest::factory()->ended()->create());
        $this->join($contest, $user);

        $this->submit($user, $problem, $contest)->assertForbidden();
        $this->assertDatabaseCount('submissions', 0);
    }

    public function test_timed_contest_allows_submit_during_window(): void
    {
        $user = User::factory()->create();
        // Default factory window: starts_at = now()-1h, ends_at = now()+1h (running).
        [$contest, $problem] = $this->contestWithProblem(Contest::factory()->create());
        $this->join($contest, $user);

        $this->submit($user, $problem, $contest)->assertRedirect();
        $this->assertDatabaseCount('submissions', 1);
        Queue::assertPushed(ProcessSubmissionJob::class);
    }

    public function test_submission_blocked_when_problem_not_attached_to_contest(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $this->join($contest, $user);
        $orphan = Problem::factory()->create(); // never attached to the contest

        $this->submit($user, $orphan, $contest)->assertForbidden();
        $this->assertDatabaseCount('submissions', 0);
    }

    public function test_normal_non_contest_submission_still_works(): void
    {
        $user = User::factory()->create();
        $problem = Problem::factory()->create();

        $this->actingAs($user)->post('/submissions', [
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(1)',
        ])->assertRedirect();

        $this->assertDatabaseCount('submissions', 1);
        Queue::assertPushed(ProcessSubmissionJob::class);
    }

    public function test_joining_a_contest_is_idempotent(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();

        $this->actingAs($user)->post("/arena/{$contest->slug}/join")->assertRedirect();
        $this->actingAs($user)->post("/arena/{$contest->slug}/join")->assertRedirect();

        $this->assertDatabaseCount('contest_participants', 1);
    }
}
