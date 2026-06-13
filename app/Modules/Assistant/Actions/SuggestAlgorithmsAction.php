<?php

namespace App\Modules\Assistant\Actions;

use App\Services\AI\PrimaryTextGenerator;
use App\Services\AI\TextGenerator;
use App\Services\BenchmarkKeys;

class SuggestAlgorithmsAction
{
    public function __construct(
        protected TextGenerator $ai
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(string $problemDescription): array
    {
        $response = trim($this->ai->generate($this->prompt($problemDescription), 30));
        if (strlen($response) > 60000) {
            return $this->fallbackSuggestion('Model response was too large to use safely.');
        }

        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $response, $m)) {
            $response = trim($m[1]);
        }

        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return $this->fallbackSuggestion(
                $response === ''
                    ? 'No suggestion parsed.'
                    : 'Model response could not be parsed safely.'
            );
        }

        $suggestions = [];
        foreach (array_slice($decoded, 0, 20) as $item) {
            if (! is_array($item) || trim((string) ($item['name'] ?? '')) === '') {
                continue;
            }

            $benchmarkKey = (string) ($item['benchmark_key'] ?? 'sorting');
            if (! in_array($benchmarkKey, BenchmarkKeys::KEYS, true)) {
                $benchmarkKey = 'sorting';
            }

            $suggestions[] = [
                'name' => mb_substr((string) $item['name'], 0, 255),
                'complexity_time' => mb_substr((string) ($item['complexity_time'] ?? 'Varies'), 0, 100),
                'complexity_space' => mb_substr((string) ($item['complexity_space'] ?? 'Varies'), 0, 100),
                'description' => mb_substr((string) ($item['description'] ?? ''), 0, 1000),
                'when_best' => mb_substr((string) ($item['when_best'] ?? '-'), 0, 500),
                'benchmark_key' => $benchmarkKey,
            ];
        }

        return $suggestions ?: $this->fallbackSuggestion('No valid suggestion parsed.');
    }

    public function providerName(): string
    {
        return $this->ai instanceof PrimaryTextGenerator
            ? $this->ai->activeProvider()
            : (string) config('services.ai.primary', 'ollama');
    }

    public function providerModel(): string
    {
        return $this->providerName() === 'openai'
            ? (string) config('services.ai.openai.model', 'gpt-4o')
            : (string) config('services.ollama.model');
    }

    private function prompt(string $problemDescription): string
    {
        return <<<'PROMPT'
You are an expert in algorithms and data structures. Given a problem description, suggest 2 to 4 suitable algorithms.
For each algorithm provide:
1. name: short name (e.g. "Binary Search", "Quick Sort")
2. complexity_time: big-O time complexity (e.g. "O(n log n)")
3. complexity_space: big-O space complexity (e.g. "O(1)")
4. description: 1-2 sentences why it fits this problem
5. when_best: when this algorithm is the best choice (e.g. "When data is sorted")
6. benchmark_key: a key we can use to run a benchmark - use one of: sorting, search, graph_bfs, graph_dfs, dynamic_programming, greedy, divide_conquer, backtracking, two_pointers, sliding_window, binary_search, heap, hash_map
Reply ONLY with a valid JSON array of objects, no markdown or extra text. Example:
[{"name":"Binary Search","complexity_time":"O(log n)","complexity_space":"O(1)","description":"Fits when the array is sorted.","when_best":"Sorted array, single target","benchmark_key":"binary_search"}]

Problem:
PROMPT . "\n".$problemDescription;
    }

    private function fallbackSuggestion(string $description): array
    {
        return [
            [
                'name' => 'General approach',
                'complexity_time' => 'Varies',
                'complexity_space' => 'Varies',
                'description' => mb_substr($description, 0, 1000),
                'when_best' => '-',
                'benchmark_key' => 'sorting',
            ],
        ];
    }
}
