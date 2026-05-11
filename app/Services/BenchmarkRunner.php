<?php

namespace App\Services;

/**
 * Runs synthetic PHP micro-benchmarks with generated data and measures time + memory.
 *
 * These numbers are for rough, same-machine comparison of our PHP stand-ins only. They do not
 * reflect a user’s C++/Python solution or real competitive-programming constraints. Several
 * keys share the same underlying routine (e.g. greedy, two_pointers, sliding_window → two-sum
 * style work on sorted data). Graph benchmarks cap node count (see generateData) so `n` is
 * not comparable across all keys.
 *
 * @see runAll() uses a single fixed input size for every key.
 */
class BenchmarkRunner
{
    /** Default problem size used by runAll() for each benchmark_key. */
    public const DEFAULT_RUN_ALL_SIZE = 1000;

    /** Hard ceiling on any single run() call to prevent memory exhaustion. */
    public const MAX_SINGLE_RUN_SIZE = 10_000;

    public function run(string $benchmarkKey, int $size = 1000): array
    {
        $size = max(1, min($size, self::MAX_SINGLE_RUN_SIZE));
        $data = $this->generateData($benchmarkKey, $size);
        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        $this->execute($benchmarkKey, $data);

        $timeMs = (microtime(true) - $startTime) * 1000;
        $memoryMb = (memory_get_usage(true) - $startMemory) / (1024 * 1024);

        return [
            'time_ms' => round($timeMs, 2),
            'memory_mb' => round($memoryMb, 4),
            'n' => $size,
        ];
    }

    public function runAll(array $benchmarkKeys): array
    {
        $results = [];
        $defaultSize = self::DEFAULT_RUN_ALL_SIZE;
        foreach ($benchmarkKeys as $key) {
            $key = $key ?: 'sorting';
            try {
                $results[$key] = $this->run($key, $defaultSize);
            } catch (\Throwable $e) {
                $results[$key] = ['time_ms' => 0, 'memory_mb' => 0, 'n' => $defaultSize, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    protected function generateData(string $key, int $n): array
    {
        $arr = [];
        for ($i = 0; $i < $n; $i++) {
            $arr[] = random_int(1, $n * 10);
        }
        switch ($key) {
            case 'sorting':
            case 'divide_conquer':
                return $arr;
            case 'binary_search':
            case 'search':
                sort($arr);

                return $arr;
            case 'graph_bfs':
            case 'graph_dfs':
                $nodes = (int) sqrt($n);
                $nodes = max(2, min($nodes, 100));
                $adj = array_fill(0, $nodes, []);
                for ($i = 0; $i < $nodes * 2; $i++) {
                    $a = random_int(0, $nodes - 1);
                    $b = random_int(0, $nodes - 1);
                    if ($a !== $b && ! in_array($b, $adj[$a], true)) {
                        $adj[$a][] = $b;
                    }
                }

                return ['adj' => $adj, 'start' => 0];
            case 'dynamic_programming':
                return array_slice($arr, 0, min(50, $n));
            case 'greedy':
            case 'two_pointers':
            case 'sliding_window':
            case 'hash_map':
            case 'heap':
            case 'backtracking':
            default:
                return $arr;
        }
    }

    protected function execute(string $key, $data): void
    {
        switch ($key) {
            case 'sorting':
            case 'divide_conquer':
                $this->quicksort($data);
                break;
            case 'binary_search':
            case 'search':
                $target = $data[count($data) >> 1] ?? $data[0];
                $this->binarySearch($data, $target);
                break;
            case 'graph_bfs':
                $this->bfs($data['adj'], $data['start']);
                break;
            case 'graph_dfs':
                $this->dfs($data['adj'], $data['start']);
                break;
            case 'dynamic_programming':
                $this->fibonacciDp(count($data));
                break;
            case 'greedy':
            case 'two_pointers':
            case 'sliding_window':
                $this->twoPointersSum($data, $data[0] + ($data[1] ?? $data[0]));
                break;
            case 'hash_map':
                $this->hashMapCount($data);
                break;
            case 'heap':
                $this->heapSort($data);
                break;
            case 'backtracking':
                $this->subsetSum($data, intdiv(array_sum($data), 2));
                break;
            default:
                $this->quicksort($data);
        }
    }

    private function quicksort(array &$arr): void
    {
        $lo = 0;
        $hi = count($arr) - 1;
        $this->quicksortRec($arr, $lo, $hi);
    }

    private function quicksortRec(array &$arr, int $lo, int $hi): void
    {
        if ($lo >= $hi) {
            return;
        }
        $p = $this->partition($arr, $lo, $hi);
        $this->quicksortRec($arr, $lo, $p - 1);
        $this->quicksortRec($arr, $p + 1, $hi);
    }

    private function partition(array &$arr, int $lo, int $hi): int
    {
        $pivot = $arr[$hi];
        $i = $lo - 1;
        for ($j = $lo; $j < $hi; $j++) {
            if ($arr[$j] <= $pivot) {
                $i++;
                [$arr[$i], $arr[$j]] = [$arr[$j], $arr[$i]];
            }
        }
        [$arr[$i + 1], $arr[$hi]] = [$arr[$hi], $arr[$i + 1]];

        return $i + 1;
    }

    private function binarySearch(array $arr, int $target): int
    {
        $lo = 0;
        $hi = count($arr) - 1;
        while ($lo <= $hi) {
            $mid = (int) (($lo + $hi) / 2);
            if ($arr[$mid] === $target) {
                return $mid;
            }
            if ($arr[$mid] < $target) {
                $lo = $mid + 1;
            } else {
                $hi = $mid - 1;
            }
        }

        return -1;
    }

    private function bfs(array $adj, int $start): array
    {
        $visited = array_fill(0, count($adj), false);
        $visited[$start] = true;
        $queue = [$start];
        $offset = 0;
        $order = [];
        while ($offset < count($queue)) {
            $u = $queue[$offset++];
            $order[] = $u;
            foreach ($adj[$u] ?? [] as $v) {
                if (! $visited[$v]) {
                    $visited[$v] = true;
                    $queue[] = $v;
                }
            }
        }

        return $order;
    }

    private function dfs(array $adj, int $start): void
    {
        $visited = array_fill(0, count($adj), false);
        $this->dfsRec($adj, $start, $visited);
    }

    private function dfsRec(array $adj, int $u, array &$visited): void
    {
        $visited[$u] = true;
        foreach ($adj[$u] ?? [] as $v) {
            if (! $visited[$v]) {
                $this->dfsRec($adj, $v, $visited);
            }
        }
    }

    private function fibonacciDp(int $n): int
    {
        if ($n <= 1) {
            return $n;
        }
        $dp = [0, 1];
        for ($i = 2; $i <= $n; $i++) {
            $dp[$i] = $dp[$i - 1] + $dp[$i - 2];
        }

        return $dp[$n];
    }

    private function twoPointersSum(array $arr, int $target): bool
    {
        $arr = array_values($arr);
        sort($arr);
        $lo = 0;
        $hi = count($arr) - 1;
        while ($lo < $hi) {
            $s = $arr[$lo] + $arr[$hi];
            if ($s === $target) {
                return true;
            }
            if ($s < $target) {
                $lo++;
            } else {
                $hi--;
            }
        }

        return false;
    }

    private function hashMapCount(array $arr): array
    {
        $count = [];
        foreach ($arr as $v) {
            $count[$v] = ($count[$v] ?? 0) + 1;
        }

        return $count;
    }

    private function heapSort(array $arr): array
    {
        $n = count($arr);
        for ($i = (int) ($n / 2) - 1; $i >= 0; $i--) {
            $this->heapify($arr, $n, $i);
        }
        for ($i = $n - 1; $i > 0; $i--) {
            [$arr[0], $arr[$i]] = [$arr[$i], $arr[0]];
            $this->heapify($arr, $i, 0);
        }

        return $arr;
    }

    private function heapify(array &$arr, int $n, int $i): void
    {
        $largest = $i;
        $l = 2 * $i + 1;
        $r = 2 * $i + 2;
        if ($l < $n && $arr[$l] > $arr[$largest]) {
            $largest = $l;
        }
        if ($r < $n && $arr[$r] > $arr[$largest]) {
            $largest = $r;
        }
        if ($largest !== $i) {
            [$arr[$i], $arr[$largest]] = [$arr[$largest], $arr[$i]];
            $this->heapify($arr, $n, $largest);
        }
    }

    private function subsetSum(array $arr, int $target): bool
    {
        $n = count($arr);
        if ($n === 0) {
            return $target === 0;
        }

        return $this->subsetSumRec($arr, $n - 1, $target);
    }

    private function subsetSumRec(array $arr, int $i, int $target): bool
    {
        if ($target === 0) {
            return true;
        }
        if ($i < 0 || $target < 0) {
            return false;
        }

        return $this->subsetSumRec($arr, $i - 1, $target - $arr[$i])
            || $this->subsetSumRec($arr, $i - 1, $target);
    }
}
