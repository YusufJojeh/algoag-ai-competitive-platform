<?php

namespace App\Services;

use App\Services\AI\TextGenerator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService implements TextGenerator
{
    private const SUGGEST_TIMEOUT = 30;
    private const RECOMMEND_TIMEOUT = 30;
    private const MAX_RESPONSE_BYTES = 60000;

    protected string $baseUrl;

    protected string $model;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.ollama.url', 'http://localhost:11434'), '/');
        $this->model = config('services.ollama.model', 'llama3.2');
    }

    /**
     * Check if Ollama is reachable.
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(3)->get("{$this->baseUrl}/api/tags");

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('ollama.unavailable', [
                'provider' => 'ollama',
                'failure_category' => 'connection_failed',
            ]);

            return false;
        }
    }

    /**
     * Generate completion (non-streaming).
     *
     * @param  int  $timeout  Timeout in seconds (default 120; use higher for long pipelines)
     */
    public function generate(string $prompt, int $timeout = 120): string
    {
        $url = "{$this->baseUrl}/api/generate";
        $body = [
            'model' => $this->model,
            'prompt' => $prompt,
            'stream' => false,
        ];

        $response = Http::timeout($timeout)->post($url, $body);

        if (! $response->successful()) {
            Log::warning('ollama.generate.failed', [
                'provider' => 'ollama',
                'status_code' => $response->status(),
            ]);

            throw new \RuntimeException('Ollama request failed.');
        }

        $data = $response->json();

        return $data['response'] ?? '';
    }

    /**
     * Analyze problem description and suggest algorithms (structured for frontend).
     */
    public function suggestAlgorithms(string $problemDescription): array
    {
        $systemPrompt = <<<'PROMPT'
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
PROMPT;

        $prompt = $systemPrompt."\n\nProblem:\n".$problemDescription;

        $response = $this->generate($prompt, self::SUGGEST_TIMEOUT);
        $response = trim($response);
        if (strlen($response) > self::MAX_RESPONSE_BYTES) {
            return $this->fallbackSuggestion('Model response was too large to use safely.');
        }

        // Strip possible markdown code block
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

    /**
     * Get final recommendation text based on benchmark results.
     */
    public function recommend(array $suggestions, array $benchmarkResults): string
    {
        $context = "Suggested algorithms:\n".json_encode($suggestions, JSON_PRETTY_PRINT)."\n\nBenchmark results (time_ms, memory_mb):\n".json_encode($benchmarkResults, JSON_PRETTY_PRINT);
        $prompt = 'You are a friendly Arabic competitive-programming coach (مدرب). Based on the above suggestions and benchmark results, write a short final recommendation (2-4 sentences) in clear Arabic with a warm, encouraging coaching tone (keep technical terms like binary search in English inline): which algorithm to choose and why. If the user clearly used English, answer in English instead. Be concise.';

        $response = $this->generate($context."\n\n".$prompt, self::RECOMMEND_TIMEOUT);

        return mb_substr(trim($response), 0, 4000);
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
