<?php

namespace Tests\Feature;

use App\Jobs\ProcessCodeforcesSolutionJob;
use App\Models\CodeforcesSolution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CodeforcesSolveControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_solve_index_returns_200_and_inertia(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        $response = $this->get('/solve');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('CodeforcesSolve')
            ->has('ollamaAvailable')
            ->has('recentSolutions')
            ->has('flash')
        );
    }

    public function test_solve_post_requires_problem_min_length(): void
    {
        $response = $this->post('/solve', ['problem' => 'short']);

        $response->assertSessionHasErrors('problem');
    }

    public function test_solve_post_rejects_problem_over_max_length(): void
    {
        $response = $this->post('/solve', ['problem' => str_repeat('a', 50001)]);

        $response->assertSessionHasErrors('problem');
    }

    public function test_solve_post_returns_error_when_ollama_unavailable(): void
    {
        Http::fake(['*' => Http::response(null, 500)]);

        $response = $this->post('/solve', [
            'problem' => 'Given an array of n integers, find the maximum sum.',
        ]);

        $response->assertSessionHasErrors('ollama');
    }

    public function test_solve_index_returns_empty_recent_when_table_missing(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        Schema::dropIfExists('codeforces_solutions');

        $response = $this->get('/solve');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('recentSolutions')->where('recentSolutions', [])->component('CodeforcesSolve'));
    }

    public function test_solve_post_dispatches_job_and_redirects(): void
    {
        Queue::fake();
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        $response = $this->post('/solve', [
            'problem' => 'Given n numbers, find the maximum.',
            'language' => 'cpp',
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('/solve/result/', (string) $response->headers->get('Location'));

        $solution = CodeforcesSolution::query()->latest()->first();
        $this->assertNotNull($solution);
        $this->assertSame($this->user->id, $solution->user_id);
        $this->assertSame(CodeforcesSolution::STATUS_PENDING, $solution->status);

        Queue::assertPushed(ProcessCodeforcesSolutionJob::class, fn (ProcessCodeforcesSolutionJob $job) => $job->solutionId === $solution->id);
    }

    public function test_solve_result_returns_404_for_missing_id(): void
    {
        $response = $this->get('/solve/result/99999');

        $response->assertStatus(404);
    }

    public function test_solve_result_returns_saved_solution(): void
    {
        $solution = CodeforcesSolution::create([
            'user_id' => $this->user->id,
            'problem_text' => 'Find max in array.',
            'status' => CodeforcesSolution::STATUS_COMPLETED,
            'parsed_problem' => ['title' => 'Max', 'description' => '...'],
            'solution_code' => '#include <iostream>',
            'solution_language' => 'cpp',
            'explanation' => 'شرح',
            'generated_tests' => [],
            'run_results' => ['engine' => 'stub'],
            'algorithm_breakdown' => 'خوارزمية',
        ]);

        $response = $this->get("/solve/result/{$solution->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('CodeforcesResult')
            ->has('solution')
            ->where('solution.id', $solution->id)
            ->where('solution.status', 'completed')
            ->has('statusPollUrl')
        );
    }

    public function test_solve_result_returns_403_for_other_user(): void
    {
        $other = User::factory()->create();
        $solution = CodeforcesSolution::create([
            'user_id' => $other->id,
            'problem_text' => 'X',
            'status' => CodeforcesSolution::STATUS_COMPLETED,
        ]);

        $response = $this->get("/solve/result/{$solution->id}");

        $response->assertStatus(403);
    }

    public function test_solve_post_accepts_python_language(): void
    {
        Queue::fake();
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        $response = $this->post('/solve', [
            'problem' => 'Print one.',
            'language' => 'python',
        ]);

        $response->assertRedirect();
        $solution = CodeforcesSolution::query()->latest()->first();
        $this->assertSame('python', $solution->solution_language);
    }

    public function test_result_status_returns_json_for_owner(): void
    {
        $solution = CodeforcesSolution::create([
            'user_id' => $this->user->id,
            'problem_text' => 'X',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $response = $this->getJson("/solve/result/{$solution->id}/status");

        $response->assertOk();
        $response->assertJson(['status' => CodeforcesSolution::STATUS_PENDING]);
    }

    // SEC-01: error_message surfaced to the client must be the generic string, never raw exception.

    public function test_result_status_returns_generic_error_message_not_raw_exception(): void
    {
        $solution = CodeforcesSolution::create([
            'user_id'       => $this->user->id,
            'problem_text'  => 'X',
            'status'        => CodeforcesSolution::STATUS_FAILED,
            'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
        ]);

        $response = $this->getJson("/solve/result/{$solution->id}/status");

        $response->assertOk();
        $response->assertJson([
            'status'        => CodeforcesSolution::STATUS_FAILED,
            'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
        ]);
        $responseBody = $response->getContent();
        $this->assertStringNotContainsString('Exception', $responseBody);
        $this->assertStringNotContainsString('stack', $responseBody);
        $this->assertStringNotContainsString('password', $responseBody);
    }

    public function test_show_result_does_not_expose_stack_trace_on_failure(): void
    {
        $solution = CodeforcesSolution::create([
            'user_id'       => $this->user->id,
            'problem_text'  => 'X',
            'status'        => CodeforcesSolution::STATUS_FAILED,
            'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
        ]);

        $response = $this->get("/solve/result/{$solution->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('solution.error_message', 'تعذر إكمال العملية. حاول مرة أخرى.')
        );
    }

    // SEC-02: CodeforcesSolution policy must be enforced — resultStatus is ownership-gated.

    public function test_result_status_returns_403_for_other_user(): void
    {
        $other = User::factory()->create();
        $solution = CodeforcesSolution::create([
            'user_id'      => $other->id,
            'problem_text' => 'X',
            'status'       => CodeforcesSolution::STATUS_PENDING,
        ]);

        $response = $this->getJson("/solve/result/{$solution->id}/status");

        $response->assertStatus(403);
    }
}
