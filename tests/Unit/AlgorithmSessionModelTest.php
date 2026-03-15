<?php

namespace Tests\Unit;

use App\Models\AlgorithmSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlgorithmSessionModelTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }

    public function test_can_create_session_with_fillable_attributes(): void
    {
        $session = AlgorithmSession::create([
            'problem' => 'Sort array',
            'suggestions' => [['name' => 'Quicksort']],
            'benchmark_results' => ['sorting' => ['time_ms' => 1.5]],
            'recommendation' => 'Use quicksort.',
        ]);

        $this->assertSame('Sort array', $session->problem);
        $this->assertIsArray($session->suggestions);
        $this->assertSame('Quicksort', $session->suggestions[0]['name']);
        $this->assertIsArray($session->benchmark_results);
        $this->assertSame(1.5, $session->benchmark_results['sorting']['time_ms']);
        $this->assertSame('Use quicksort.', $session->recommendation);
    }

    public function test_casts_suggestions_and_benchmark_results_to_array(): void
    {
        $session = AlgorithmSession::create([
            'problem' => 'P',
            'suggestions' => [['name' => 'A']],
            'benchmark_results' => ['k' => ['time_ms' => 0]],
            'recommendation' => 'R',
        ]);

        $session->refresh();
        $this->assertIsArray($session->suggestions);
        $this->assertIsArray($session->benchmark_results);
    }

    public function test_table_name_is_algorithm_sessions(): void
    {
        $session = new AlgorithmSession;
        $this->assertSame('algorithm_sessions', $session->getTable());
    }

    public function test_fillable_attributes(): void
    {
        $session = new AlgorithmSession;
        $this->assertContains('problem', $session->getFillable());
        $this->assertContains('suggestions', $session->getFillable());
        $this->assertContains('benchmark_results', $session->getFillable());
        $this->assertContains('recommendation', $session->getFillable());
    }

    public function test_can_update_session(): void
    {
        $session = AlgorithmSession::create([
            'problem' => 'P',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => 'R',
        ]);

        $session->update(['recommendation' => 'Updated R']);
        $session->refresh();

        $this->assertSame('Updated R', $session->recommendation);
    }

    public function test_timestamps_exist(): void
    {
        $session = AlgorithmSession::create([
            'problem' => 'P',
            'suggestions' => [],
            'benchmark_results' => [],
            'recommendation' => 'R',
        ]);

        $this->assertNotNull($session->created_at);
        $this->assertNotNull($session->updated_at);
    }
}
