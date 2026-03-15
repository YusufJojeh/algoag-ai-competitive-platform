<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
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
            Log::warning('Ollama not available: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate completion (single prompt, streaming or not).
     */
    public function generate(string $prompt, bool $stream = false): string
    {
        $url = "{$this->baseUrl}/api/generate";
        $body = [
            'model' => $this->model,
            'prompt' => $prompt,
            'stream' => $stream,
        ];

        if ($stream) {
            $streamBody = is_string($body) ? $body : json_encode($body);
            Http::timeout(120)->withBody($streamBody, 'application/json')->post($url);
        }

        $response = Http::timeout(120)->post($url, $body);

        if (! $response->successful()) {
            throw new \RuntimeException('Ollama request failed: ' . $response->body());
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

        $prompt = $systemPrompt . "\n\nProblem:\n" . $problemDescription;

        $response = $this->generate($prompt);
        $response = trim($response);
        // Strip possible markdown code block
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $response, $m)) {
            $response = trim($m[1]);
        }
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return [
                ['name' => 'General approach', 'complexity_time' => 'Varies', 'complexity_space' => 'Varies', 'description' => $response ?: 'No suggestion parsed.', 'when_best' => '-', 'benchmark_key' => 'sorting'],
            ];
        }
        return $decoded;
    }

    /**
     * Get final recommendation text based on benchmark results.
     */
    public function recommend(array $suggestions, array $benchmarkResults): string
    {
        $context = "Suggested algorithms:\n" . json_encode($suggestions, JSON_PRETTY_PRINT) . "\n\nBenchmark results (time_ms, memory_mb):\n" . json_encode($benchmarkResults, JSON_PRETTY_PRINT);
        $prompt = "Based on the above suggestions and benchmark results, write a short final recommendation (2-4 sentences) in the same language as the user (Arabic or English): which algorithm to choose and why. Be concise.";
        return $this->generate($context . "\n\n" . $prompt);
    }
}
