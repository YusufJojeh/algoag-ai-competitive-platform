<?php

namespace App\Http\Controllers;

use App\Models\AlgorithmSession;
use App\Services\BenchmarkRunner;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlgorithmAssistantController extends Controller
{
    public function __construct(
        protected OllamaService $ollama,
        protected BenchmarkRunner $benchmarks
    ) {}

    /**
     * Main page: describe problem and get suggestions.
     */
    public function index(Request $request)
    {
        $ollamaAvailable = $this->ollama->isAvailable();
        $recentSessions = [];
        try {
            $recentSessions = AlgorithmSession::query()
                ->latest()
                ->take(10)
                ->get(['id', 'problem', 'recommendation', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'problem_preview' => \Illuminate\Support\Str::limit($s->problem, 80),
                    'recommendation_preview' => $s->recommendation ? \Illuminate\Support\Str::limit($s->recommendation, 100) : null,
                    'created_at' => $s->created_at->diffForHumans(),
                ])
                ->all();
        } catch (\Throwable $e) {
            // Table may not exist yet
        }

        return Inertia::render('Home', [
            'ollamaAvailable' => $ollamaAvailable,
            'recentSessions' => $recentSessions,
            'flash' => [
                'message' => $request->session()->get('message'),
            ],
        ]);
    }

    /**
     * Analyze problem and suggest algorithms (Ollama).
     */
    public function suggest(Request $request)
    {
        $request->validate([
            'problem' => 'required|string|min:10|max:2000',
        ]);

        $problem = $request->input('problem');

        try {
            $suggestions = $this->ollama->suggestAlgorithms($problem);
        } catch (\Throwable $e) {
            return back()->withErrors(['ollama' => 'تعذر الاتصال بـ Ollama. تأكد أنه يعمل محلياً (ollama serve). ' . $e->getMessage()]);
        }

        return Inertia::render('Suggestions', [
            'problem' => $problem,
            'suggestions' => $suggestions,
            'ollamaAvailable' => $this->ollama->isAvailable(),
        ]);
    }

    /**
     * Run benchmarks for suggested algorithms and get recommendation.
     */
    public function benchmark(Request $request)
    {
        $request->validate([
            'problem' => 'required|string',
            'suggestions' => 'required|array',
            'suggestions.*.name' => 'required|string',
            'suggestions.*.benchmark_key' => 'nullable|string',
        ]);

        $problem = $request->input('problem');
        $suggestions = $request->input('suggestions');
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
                'problem' => $problem,
                'suggestions' => $suggestions,
                'benchmark_results' => $results,
                'recommendation' => $recommendation,
            ]);
        } catch (\Throwable $e) {
            // DB might not be set up; continue without saving
        }

        return Inertia::render('Results', [
            'problem' => $problem,
            'suggestions' => $suggestions,
            'benchmarkResults' => $results,
            'recommendation' => $recommendation,
            'sessionId' => $session?->id,
        ]);
    }

    /**
     * Show a saved session (past result).
     */
    public function showSession(int $id)
    {
        $session = AlgorithmSession::findOrFail($id);

        return Inertia::render('Results', [
            'problem' => $session->problem,
            'suggestions' => $session->suggestions ?? [],
            'benchmarkResults' => $session->benchmark_results ?? [],
            'recommendation' => $session->recommendation ?? '',
            'sessionId' => $session->id,
        ]);
    }
}
