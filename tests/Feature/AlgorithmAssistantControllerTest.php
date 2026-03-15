<?php

namespace Tests\Feature;

use App\Models\AlgorithmSession;
use App\Services\BenchmarkRunner;
use App\Services\OllamaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AlgorithmAssistantControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    public function test_home_returns_200_and_inertia_home(): void
    {
        Http::fake([
            '*/api/tags' => Http::response([], 200),
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Home')
            ->has('ollamaAvailable')
            ->has('recentSessions')
            ->has('flash')
        );
    }

    public function test_home_works_when_ollama_unavailable(): void
    {
        Http::fake([
            '*' => Http::response(null, 500),
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('ollamaAvailable', false)
        );
    }

    public function test_home_shows_recent_sessions_when_db_has_sessions(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        AlgorithmSession::create([
            'problem' => 'Sort an array of integers.',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => 'Use quicksort.',
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('recentSessions', 1)
            ->where('recentSessions.0.problem_preview', 'Sort an array of integers.')
        );
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
            'problem' => 'Old problem.',
            'suggestions' => [['name' => 'Algo', 'benchmark_key' => 'sorting']],
            'benchmark_results' => ['sorting' => ['time_ms' => 1, 'memory_mb' => 0.1, 'n' => 100]],
            'recommendation' => 'Use it.',
        ]);

        $response = $this->get('/session/' . $session->id);

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
            'problem' => 'Sort.',
            'suggestions' => [['name' => 'Sort', 'benchmark_key' => 'sorting']],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('recommendation', 'لم نتمكن من توليد توصية تلقائية. راجع مقارنة الأداء أعلاه.')
        );
    }

    public function test_benchmark_validation_requires_suggestion_names(): void
    {
        $response = $this->post('/benchmark', [
            'problem' => 'P',
            'suggestions' => [['name' => '']],
        ]);

        $response->assertSessionHasErrors();
    }

    public function test_show_session_with_null_recommendation_and_empty_arrays(): void
    {
        $session = AlgorithmSession::create([
            'problem' => 'Minimal.',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => null,
        ]);

        $response = $this->get('/session/' . $session->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('problem', 'Minimal.')
            ->has('suggestions')
            ->has('benchmarkResults')
        );
    }

    public function test_home_recent_sessions_limited_to_10(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        for ($i = 0; $i < 15; $i++) {
            AlgorithmSession::create([
                'problem' => "Problem {$i}",
                'suggestions' => [],
                'benchmark_results' => [],
                'recommendation' => '',
            ]);
        }

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('recentSessions', 10));
    }

    public function test_home_flash_message_passed_to_view(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        $response = $this->withSession(['message' => 'تم بنجاح'])->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->where('flash.message', 'تم بنجاح'));
    }

    public function test_suggest_returns_multiple_suggestions(): void
    {
        $json = '[{"name":"A","complexity_time":"O(n)","complexity_space":"O(1)","description":"d","when_best":"w","benchmark_key":"sorting"},{"name":"B","complexity_time":"O(n log n)","complexity_space":"O(1)","description":"d2","when_best":"w2","benchmark_key":"binary_search"}]';
        Http::fake(['*/api/generate' => Http::response(['response' => $json], 200)]);

        $response = $this->post('/suggest', ['problem' => 'Sort and search in array.']);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('suggestions', 2)->where('suggestions.1.name', 'B'));
    }

    public function test_index_returns_empty_sessions_when_db_throws(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        Schema::dropIfExists('algorithm_sessions');

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('recentSessions')->component('Home'));
    }

    public function test_benchmark_when_session_create_fails_still_returns_results_without_session_id(): void
    {
        Http::fake(['*/api/generate' => Http::response(['response' => 'Use it.'], 200)]);

        Schema::dropIfExists('algorithm_sessions');

        $response = $this->post('/benchmark', [
            'problem' => 'Sort data.',
            'suggestions' => [['name' => 'Quick Sort', 'benchmark_key' => 'sorting']],
        ]);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Results')
            ->where('problem', 'Sort data.')
            ->where('sessionId', null)
        );
    }

    public function test_home_session_with_null_recommendation_uses_null_preview(): void
    {
        Http::fake(['*/api/tags' => Http::response([], 200)]);

        AlgorithmSession::create([
            'problem' => 'Problem with no recommendation text.',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => null,
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('recentSessions.0.recommendation_preview', null)
        );
    }
}
