<?php

namespace App\Modules\Assistant\Actions;

use App\Models\AlgorithmSession;
use App\Services\AI\AiUsageService;
use App\Services\AI\PrimaryTextGenerator;
use App\Services\AI\TextGenerator;
use App\Services\BenchmarkRunner;
use Illuminate\Support\Facades\Log;

class RunBenchmarkWorkflowAction
{
    public function __construct(
        protected TextGenerator $ai,
        protected BenchmarkRunner $benchmarks,
        protected AiUsageService $usage
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $suggestions
     * @return array{results: array<string, mixed>, recommendation: string, session: AlgorithmSession|null}
     */
    public function handle(int $userId, string $problem, array $suggestions): array
    {
        $keys = array_map(fn ($s) => $s['benchmark_key'] ?? 'sorting', $suggestions);
        $keys = array_unique(array_filter($keys));

        $results = $this->benchmarks->runAll($keys);

        $recommendation = '';
        try {
            $recommendation = $this->recommend($suggestions, $results);
            $this->usage->record(
                $userId,
                AiUsageService::FEATURE_ALGORITHM_BENCHMARK,
                'completed',
                $this->providerName(),
                $this->providerModel(),
            );
        } catch (\Throwable $e) {
            $recommendation = 'We could not generate an automatic recommendation. Review the benchmark results above.';
            Log::warning('algorithm.benchmark.recommendation_failed', [
                'user_id' => $userId,
                'provider' => $this->providerName(),
                'failure_category' => 'provider_failure',
            ]);
            $this->usage->record(
                $userId,
                AiUsageService::FEATURE_ALGORITHM_BENCHMARK,
                'failed',
                $this->providerName(),
                $this->providerModel(),
                null,
                null,
                'provider_failure',
            );
        }

        $session = null;
        try {
            $session = AlgorithmSession::create([
                'user_id' => $userId,
                'problem' => $problem,
                'suggestions' => $suggestions,
                'benchmark_results' => $results,
                'recommendation' => $recommendation,
            ]);
        } catch (\Throwable $e) {
            Log::warning('algorithm_sessions create failed', [
                'user_id' => $userId,
                'message' => $e->getMessage(),
            ]);
        }

        return [
            'results' => $results,
            'recommendation' => $recommendation,
            'session' => $session,
        ];
    }

    protected function providerName(): string
    {
        return $this->ai instanceof PrimaryTextGenerator
            ? $this->ai->activeProvider()
            : (string) config('services.ai.primary', 'ollama');
    }

    protected function providerModel(): string
    {
        return $this->providerName() === 'openai'
            ? (string) config('services.ai.openai.model', 'gpt-4o')
            : (string) config('services.ollama.model');
    }

    private function recommend(array $suggestions, array $benchmarkResults): string
    {
        $context = "Suggested algorithms:\n".json_encode($suggestions, JSON_PRETTY_PRINT)."\n\nBenchmark results (time_ms, memory_mb):\n".json_encode($benchmarkResults, JSON_PRETTY_PRINT);
        $prompt = 'You are a friendly competitive-programming coach. Based on the above suggestions and benchmark results, write a short final recommendation (2-4 sentences): which algorithm to choose and why. If the user clearly used Arabic, answer in Arabic. Be concise.';

        return mb_substr(trim($this->ai->generate($context."\n\n".$prompt, 30)), 0, 4000);
    }
}
