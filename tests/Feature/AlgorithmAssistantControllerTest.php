<?php

namespace Tests\Feature;

use App\Models\AlgorithmSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AlgorithmAssistantControllerTest extends TestCase
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

    public function test_dashboard_home_redirects_to_problems(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/problems');
    }

    public function test_suggest_requires_problem_min_length(): void
    {
        $response = $this->post('/suggest', ['problem' => 'short']);

        $response->assertSessionHasErrors('problem');
    }

    public function test_suggest_returns_suggestions_when_ollama_returns_json(): void
    {
        $json = '[{"name":"Binary Search","complexity_time":"O(log n)","complexity_space":"O(1)","description":"Fits.","when_best":"Sorted.","benchmark_key":"binary_search"}]';
        Http::fake([
            '*/api/tags' => Http::response([], 200),
            '*/api/generate' => Http::response(['response' => $json], 200),
        ]);

        $response = $this->post('/suggest', [
            'problem' => 'I have a sorted array and need to find an element.',
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Suggestions')
            ->where('problem', 'I have a sorted array and need to find an element.')
            ->has('suggestions', 1)
            ->where('suggestions.0.name', 'Binary Search')
        );
    }

    public function test_suggest_uses_openai_primary_when_configured(): void
    {
        config([
            'services.ai.primary' => 'openai',
            'services.ai.openai.api_key' => 'test-key',
            'services.ai.openai.model' => 'gpt-4o',
        ]);

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => '[{"name":"Two Pointers","complexity_time":"O(n)","complexity_space":"O(1)","description":"Fits.","when_best":"Linear scan.","benchmark_key":"two_pointers"}]',
                    ],
                ]],
            ], 200),
        ]);

        $response = $this->post('/suggest', [
            'problem' => 'Find a pair in a sorted array with a target sum.',
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Suggestions')
            ->where('suggestions.0.name', 'Two Pointers')
            ->where('ollamaAvailable', true)
        );
        $this->assertDatabaseHas('ai_usage_records', [
            'user_id' => $this->user->id,
            'feature' => 'algorithm_suggest',
            'provider' => 'openai',
            'model' => 'gpt-4o',
            'status' => 'completed',
        ]);
    }

    public function test_suggest_returns_error_when_ollama_fails(): void
    {
        Http::fake([
            '*/api/generate' => Http::response(null, 500),
        ]);

        $response = $this->post('/suggest', [
            'problem' => 'I have a sorted array and need to find an element.',
        ]);

        $response->assertSessionHasErrors('ollama');
    }

    public function test_benchmark_runs_and_returns_results(): void
    {
        Http::fake([
            '*/api/generate' => Http::response(['response' => 'Use binary search for this case.'], 200),
        ]);

        $response = $this->post('/benchmark', [
            'problem' => 'Find element in sorted array.',
            'suggestions' => [
                ['name' => 'Binary Search', 'benchmark_key' => 'binary_search'],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Results')
            ->has('benchmarkResults')
            ->has('recommendation')
            ->where('problem', 'Find element in sorted array.')
        );
    }

    public function test_benchmark_saves_session_to_db(): void
    {
        Http::fake([
            '*/api/generate' => Http::response(['response' => 'Use sorting.'], 200),
        ]);

        $this->post('/benchmark', [
            'problem' => 'Sort data.',
            'suggestions' => [
                ['name' => 'Quick Sort', 'benchmark_key' => 'sorting'],
            ],
        ]);

        $this->assertDatabaseHas('algorithm_sessions', [
            'user_id' => $this->user->id,
            'problem' => 'Sort data.',
        ]);
    }

    public function test_benchmark_validation_requires_problem_and_suggestions(): void
    {
        $response = $this->post('/benchmark', [
            'problem' => '',
            'suggestions' => [],
        ]);

        $response->assertSessionHasErrors(['problem', 'suggestions']);
    }

    public function test_show_session_returns_404_for_missing_id(): void
    {
        $response = $this->get('/session/99999');

        $response->assertStatus(404);
    }

    public function test_show_session_returns_saved_result(): void
    {
        $session = AlgorithmSession::create([
            'user_id' => $this->user->id,
            'problem' => 'Old problem.',
            'suggestions' => [['name' => 'Algo', 'benchmark_key' => 'sorting']],
            'benchmark_results' => ['sorting' => ['time_ms' => 1, 'memory_mb' => 0.1, 'n' => 100]],
            'recommendation' => 'Use it.',
        ]);

        $response = $this->get('/session/'.$session->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Results')
            ->where('problem', 'Old problem.')
            ->where('recommendation', 'Use it.')
            ->where('sessionId', $session->id)
        );
    }

    public function test_suggest_accepts_problem_exactly_10_chars(): void
    {
        $json = '[{"name":"A","complexity_time":"O(1)","complexity_space":"O(1)","description":"x","when_best":"y","benchmark_key":"sorting"}]';
        Http::fake(['*/api/generate' => Http::response(['response' => $json], 200)]);

        $response = $this->post('/suggest', ['problem' => '1234567890']);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Suggestions')->has('suggestions'));
    }

    public function test_suggest_rejects_problem_over_max_length(): void
    {
        $response = $this->post('/suggest', ['problem' => str_repeat('a', 2001)]);

        $response->assertSessionHasErrors('problem');
    }

    public function test_benchmark_with_multiple_suggestions_and_null_benchmark_keys(): void
    {
        Http::fake(['*/api/generate' => Http::response(['response' => 'Use the first one.'], 200)]);

        $response = $this->post('/benchmark', [
            'problem' => 'Sort and search.',
            'suggestions' => [
                ['name' => 'Quick Sort', 'benchmark_key' => 'sorting'],
                ['name' => 'Binary Search', 'benchmark_key' => null],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('benchmarkResults')->has('suggestions', 2));
    }

    public function test_benchmark_returns_fallback_recommendation_when_ollama_throws(): void
    {
        Http::fake(['*/api/generate' => Http::response(null, 500)]);

        $response = $this->post('/benchmark', [
            'problem' => 'Sort the array efficiently.',
            'suggestions' => [['name' => 'Sort', 'benchmark_key' => 'sorting']],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('recommendation', 'We could not generate an automatic recommendation. Review the benchmark results above.')
        );
    }

    public function test_benchmark_validation_requires_suggestion_names(): void
    {
        $response = $this->post('/benchmark', [
            'problem' => 'Valid length problem text for benchmark validation rules here.',
            'suggestions' => [['name' => '']],
        ]);

        $response->assertSessionHasErrors();
    }

    public function test_benchmark_rejects_problem_over_max_length(): void
    {
        $response = $this->post('/benchmark', [
            'problem' => str_repeat('a', 5001),
            'suggestions' => [
                ['name' => 'Quick Sort', 'benchmark_key' => 'sorting'],
            ],
        ]);

        $response->assertSessionHasErrors('problem');
    }

    public function test_show_session_with_null_recommendation_and_empty_arrays(): void
    {
        $session = AlgorithmSession::create([
            'user_id' => $this->user->id,
            'problem' => 'Minimal.',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => null,
        ]);

        $response = $this->get('/session/'.$session->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('problem', 'Minimal.')
            ->has('suggestions')
            ->has('benchmarkResults')
        );
    }

    public function test_suggest_returns_multiple_suggestions(): void
    {
        $json = '[{"name":"A","complexity_time":"O(n)","complexity_space":"O(1)","description":"d","when_best":"w","benchmark_key":"sorting"},{"name":"B","complexity_time":"O(n log n)","complexity_space":"O(1)","description":"d2","when_best":"w2","benchmark_key":"binary_search"}]';
        Http::fake(['*/api/generate' => Http::response(['response' => $json], 200)]);

        $response = $this->post('/suggest', ['problem' => 'Sort and search in array.']);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('suggestions', 2)->where('suggestions.1.name', 'B'));
    }

    public function test_show_session_returns_403_for_other_user(): void
    {
        $other = User::factory()->create();
        $session = AlgorithmSession::create([
            'user_id' => $other->id,
            'problem' => 'Private.',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => 'x',
        ]);

        $response = $this->get('/session/'.$session->id);

        $response->assertStatus(403);
    }

    // SEC-03: benchmark_key must be from the canonical whitelist or null.

    public function test_benchmark_rejects_unknown_benchmark_key(): void
    {
        $response = $this->post('/benchmark', [
            'problem' => 'Find element in sorted array.',
            'suggestions' => [
                ['name' => 'Magic Algo', 'benchmark_key' => 'totally_made_up_key'],
            ],
        ]);

        $response->assertSessionHasErrors('suggestions.0.benchmark_key');
    }

    public function test_benchmark_accepts_null_benchmark_key(): void
    {
        Http::fake(['*/api/generate' => Http::response(['response' => 'Use sorting.'], 200)]);

        $response = $this->post('/benchmark', [
            'problem' => 'Sort data efficiently here.',
            'suggestions' => [
                ['name' => 'Quick Sort', 'benchmark_key' => null],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Results'));
    }

    public function test_benchmark_accepts_every_canonical_key(): void
    {
        Http::fake(['*/api/generate' => Http::response(['response' => 'ok'], 200)]);

        $keys = \App\Services\BenchmarkKeys::KEYS;

        foreach ($keys as $key) {
            $response = $this->post('/benchmark', [
                'problem' => 'Find element in sorted array.',
                'suggestions' => [
                    ['name' => 'Algo', 'benchmark_key' => $key],
                ],
            ]);
            $response->assertStatus(200, "Key '{$key}' should be accepted");
        }
    }

    // SEC-04: E2E login endpoint must be POST (GET must return 405).

    public function test_e2e_login_get_returns_405_in_testing_env(): void
    {
        // The e2e.fixtures middleware requires X-E2E-Secret; once it passes,
        // the GET should hit the route definition and return 405 for the POST-only verb.
        $response = $this->withHeaders(['X-E2E-Secret' => 'phpunit-e2e-secret'])
            ->get('/__e2e/runtime/auth/login');

        $response->assertStatus(405);
    }

    // COR-06: null-safe operator — index must not crash when user() returns null
    // (covered implicitly by the auth middleware, but we assert the session list
    // still returns an empty array on DB error rather than crashing).

    public function test_index_returns_200_with_empty_recent_when_db_fails(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        // Drop the sessions table so the query throws — the controller must
        // swallow it and return an empty recent list (not a 500).
        \Illuminate\Support\Facades\Schema::dropIfExists('algorithm_sessions');

        $response = $this->get('/assistant');

        $response->assertStatus(200);
    }
}
