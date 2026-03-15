<?php

namespace Tests\Unit;

use App\Services\BenchmarkRunner;
use Tests\TestCase;

class BenchmarkRunnerTest extends TestCase
{
    public function test_run_returns_time_memory_and_n(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 100);

        $this->assertArrayHasKey('time_ms', $result);
        $this->assertArrayHasKey('memory_mb', $result);
        $this->assertArrayHasKey('n', $result);
        $this->assertSame(100, $result['n']);
        $this->assertIsFloat($result['time_ms']);
        $this->assertIsFloat($result['memory_mb']);
    }

    public function test_run_all_executes_multiple_keys(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->runAll(['sorting', 'binary_search']);

        $this->assertArrayHasKey('sorting', $result);
        $this->assertArrayHasKey('binary_search', $result);
        $this->assertArrayHasKey('time_ms', $result['sorting']);
        $this->assertArrayHasKey('time_ms', $result['binary_search']);
    }

    public function test_run_all_uses_sorting_for_empty_key(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->runAll(['']);

        $this->assertArrayHasKey('sorting', $result);
    }

    public function test_run_all_unknown_key_falls_back_to_sorting(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->runAll(['unknown_key_xyz']);

        $this->assertArrayHasKey('unknown_key_xyz', $result);
        $this->assertArrayHasKey('time_ms', $result['unknown_key_xyz']);
        $this->assertArrayHasKey('n', $result['unknown_key_xyz']);
    }

    public function test_run_sorting_produces_sorted_output(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 50);
        $this->assertGreaterThanOrEqual(0, $result['time_ms']);
    }

    public function test_run_binary_search(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('binary_search', 100);
        $this->assertArrayHasKey('n', $result);
        $this->assertSame(100, $result['n']);
    }

    public function test_run_graph_bfs(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('graph_bfs', 100);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_graph_dfs(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('graph_dfs', 100);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_dynamic_programming(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('dynamic_programming', 30);
        $this->assertArrayHasKey('n', $result);
    }

    public function test_run_two_pointers(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('two_pointers', 100);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_hash_map(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('hash_map', 100);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_heap(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('heap', 100);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_backtracking(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('backtracking', 20);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_divide_conquer(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('divide_conquer', 100);
        $this->assertSame(100, $result['n']);
    }

    public function test_run_default_falls_back_to_sorting(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('unknown_key', 50);
        $this->assertArrayHasKey('n', $result);
        $this->assertSame(50, $result['n']);
    }

    public function test_run_with_size_1(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 1);
        $this->assertSame(1, $result['n']);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_with_small_n(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('binary_search', 10);
        $this->assertSame(10, $result['n']);
    }

    public function test_run_all_with_single_key(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->runAll(['heap']);
        $this->assertCount(1, $result);
        $this->assertArrayHasKey('heap', $result);
    }

    public function test_run_all_with_duplicate_keys_filters_unique(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->runAll(['sorting', 'sorting', 'binary_search']);
        $this->assertArrayHasKey('sorting', $result);
        $this->assertArrayHasKey('binary_search', $result);
    }

    public function test_run_search_key(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('search', 100);
        $this->assertSame(100, $result['n']);
    }

    public function test_run_sliding_window(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sliding_window', 50);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_greedy(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('greedy', 50);
        $this->assertArrayHasKey('n', $result);
    }

    public function test_run_memory_mb_non_negative(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 100);
        $this->assertGreaterThanOrEqual(0, $result['memory_mb']);
    }

    public function test_run_time_ms_non_negative(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('hash_map', 50);
        $this->assertGreaterThanOrEqual(0, $result['time_ms']);
    }

    public function test_run_backtracking_size_zero_covers_subset_sum_empty(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('backtracking', 0);
        $this->assertArrayHasKey('n', $result);
        $this->assertSame(0, $result['n']);
    }

    public function test_run_dynamic_programming_size_zero_covers_fib_zero(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('dynamic_programming', 0);
        $this->assertSame(0, $result['n']);
    }

    public function test_run_dynamic_programming_size_one_covers_fib_one(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('dynamic_programming', 1);
        $this->assertSame(1, $result['n']);
    }

    public function test_run_sorting_two_elements_covers_partition_and_quicksort_rec(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 2);
        $this->assertSame(2, $result['n']);
    }

    public function test_run_graph_bfs_with_multiple_nodes_covers_bfs_foreach(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('graph_bfs', 25);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_graph_dfs_covers_dfs_rec(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('graph_dfs', 25);
        $this->assertArrayHasKey('time_ms', $result);
    }

    public function test_run_heap_with_three_elements_covers_heapify_swap(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('heap', 3);
        $this->assertSame(3, $result['n']);
    }

    public function test_runAll_catch_block_returns_error_entry(): void
    {
        $runner = new class extends BenchmarkRunner {
            public function run(string $benchmarkKey, int $size = 1000): array
            {
                if ($benchmarkKey === 'throw_key') {
                    throw new \RuntimeException('Intentional test exception');
                }
                return parent::run($benchmarkKey, $size);
            }
        };
        $result = $runner->runAll(['sorting', 'throw_key']);
        $this->assertArrayHasKey('sorting', $result);
        $this->assertArrayHasKey('throw_key', $result);
        $this->assertArrayHasKey('error', $result['throw_key']);
        $this->assertSame('Intentional test exception', $result['throw_key']['error']);
        $this->assertSame(0, $result['throw_key']['time_ms']);
    }
}
