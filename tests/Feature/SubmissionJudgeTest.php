<?php

namespace Tests\Feature;

use App\Jobs\ProcessSubmissionJob;
use App\Models\ProblemTestCase;
use App\Models\Submission;
use App\Models\User;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\Judges\LocalProcessJudge;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * End-to-end coverage of the Arena submission flow: dispatch, real judging via the
 * local process judge (Python), verdict derivation, and the hidden-test guard on
 * the submission detail page.
 */
class SubmissionJudgeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Use the real local judge for these tests (phpunit binds the stub by default).
        $this->app->instance(CodeJudge::class, new LocalProcessJudge());
    }

    private function problemWithDoublingTests(): Problem
    {
        $problem = Problem::factory()->create(['time_limit_ms' => 2000]);

        ProblemTestCase::factory()->create([
            'problem_id' => $problem->id, 'ordinal' => 0,
            'input' => '3', 'expected_output' => '6', 'is_sample' => true,
        ]);
        ProblemTestCase::factory()->create([
            'problem_id' => $problem->id, 'ordinal' => 1,
            'input' => '5', 'expected_output' => '10', 'is_sample' => false,
        ]);

        return $problem;
    }

    private function runJob(Submission $submission): Submission
    {
        (new ProcessSubmissionJob($submission->id))->handle(app(CodeJudge::class));

        return $submission->fresh();
    }

    public function test_store_dispatches_job_and_redirects_to_detail(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $problem = Problem::factory()->create();

        $response = $this->actingAs($user)->post('/submissions', [
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(1)',
        ]);

        $submission = Submission::query()->latest('id')->first();
        $this->assertNotNull($submission);
        $this->assertSame('pending', $submission->verdict);
        $response->assertRedirect(route('submissions.show', $submission->id));
        Queue::assertPushed(ProcessSubmissionJob::class);
    }

    public function test_correct_python_solution_is_accepted(): void
    {
        $problem = $this->problemWithDoublingTests();
        $submission = Submission::factory()->create([
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(int(input()) * 2)',
        ]);

        $judged = $this->runJob($submission);

        $this->assertSame('accepted', $judged->verdict);
        $this->assertSame(Submission::STATUS_COMPLETED, $judged->status);
        $this->assertIsArray($judged->per_case_results);
        $this->assertCount(2, $judged->per_case_results);
    }

    public function test_wrong_python_solution_is_wrong_answer(): void
    {
        $problem = $this->problemWithDoublingTests();
        $submission = Submission::factory()->create([
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(int(input()) * 3)', // wrong
        ]);

        $judged = $this->runJob($submission);

        $this->assertSame('wrong_answer', $judged->verdict);
    }

    public function test_problem_without_tests_returns_no_tests(): void
    {
        $problem = Problem::factory()->create();
        $submission = Submission::factory()->create([
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(1)',
        ]);

        $judged = $this->runJob($submission);

        $this->assertSame('no_tests', $judged->verdict);
    }

    public function test_detail_page_hides_hidden_test_io(): void
    {
        $owner = User::factory()->create();
        $problem = $this->problemWithDoublingTests();
        $submission = Submission::factory()->create([
            'user_id' => $owner->id,
            'problem_id' => $problem->id,
            'language' => 'python',
            'code' => 'print(int(input()) * 2)',
        ]);
        $this->runJob($submission);

        $response = $this->actingAs($owner)->get(route('submissions.show', $submission->id));

        $response->assertInertia(function ($page) {
            $cases = $page->toArray()['props']['submission']['cases'];
            $this->assertSame('3', $cases[0]['input']);          // sample → exposed
            $this->assertTrue($cases[0]['is_sample']);
            $this->assertNull($cases[1]['input']);               // hidden → withheld
            $this->assertNull($cases[1]['expected_output']);
            $this->assertFalse($cases[1]['is_sample']);
        });
    }

    public function test_stub_judge_records_stub_reviewed_not_a_failure(): void
    {
        // Default config (JUDGE_USE_REAL=false) binds the stub judge.
        $this->app->forgetInstance(CodeJudge::class);
        $this->app->bind(CodeJudge::class, \App\Modules\Execution\Judges\StubCodeJudge::class);

        $problem = $this->problemWithDoublingTests();
        $submission = Submission::factory()->create([
            'problem_id' => $problem->id, 'language' => 'python', 'code' => 'print(1)',
        ]);

        $judged = $this->runJob($submission);

        $this->assertSame('stub_reviewed', $judged->verdict);
        $this->assertSame(Submission::STATUS_COMPLETED, $judged->status);
    }

    public function test_detail_page_forbids_other_users(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $submission = Submission::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->get(route('submissions.show', $submission->id))->assertForbidden();
    }
}
