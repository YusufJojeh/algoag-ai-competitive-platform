<?php

namespace App\Modules\Assistant\Actions;

use App\Models\AlgorithmSession;
use App\Services\BenchmarkRunner;
use App\Services\OllamaService;
use Illuminate\Support\Facades\Log;

class RunBenchmarkWorkflowAction
{
    public function __construct(
        protected OllamaService $ollama,
        protected BenchmarkRunner $benchmarks
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
            $recommendation = $this->ollama->recommend($suggestions, $results);
        } catch (\Throwable $e) {
            $recommendation = 'لم نتمكن من توليد توصية تلقائية. راجع مقارنة الأداء أعلاه.';
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
}
