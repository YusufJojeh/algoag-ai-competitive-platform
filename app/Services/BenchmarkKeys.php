<?php

namespace App\Services;

/**
 * Canonical keys for {@see BenchmarkRunner} and pattern manifests.
 * Keep in sync with {@see BenchmarkRunner} switch cases and Ollama prompts.
 */
final class BenchmarkKeys
{
    /** @var list<string> */
    public const KEYS = [
        'sorting',
        'search',
        'divide_conquer',
        'binary_search',
        'graph_bfs',
        'graph_dfs',
        'dynamic_programming',
        'greedy',
        'two_pointers',
        'sliding_window',
        'hash_map',
        'heap',
        'backtracking',
    ];

    public static function isAllowed(?string $key): bool
    {
        if ($key === null || $key === '') {
            return true;
        }

        return in_array($key, self::KEYS, true);
    }
}
