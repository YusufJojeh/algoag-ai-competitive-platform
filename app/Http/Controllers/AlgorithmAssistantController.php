<?php

namespace App\Http\Controllers;

use App\Http\Requests\BenchmarkRunRequest;
use App\Http\Requests\SuggestProblemRequest;
use App\Models\AlgorithmSession;
use App\Models\CodeforcesSolution;
use App\Modules\Assistant\Actions\RunBenchmarkWorkflowAction;
use App\Modules\Assistant\Actions\SuggestAlgorithmsAction;
use App\Services\AI\AiUsageService;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AlgorithmAssistantController extends Controller
{
    public function __construct(
        protected OllamaService $ollama,
        protected SuggestAlgorithmsAction $suggestAlgorithms,
        protected RunBenchmarkWorkflowAction $benchmarkWorkflow,
        protected ?AiUsageService $usage = null
    ) {}

    protected function aiProviderReady(): bool
    {
        $primary = strtolower((string) config('services.ai.primary', 'openai'));
        if ($primary === 'openai' && (string) config('services.ai.openai.api_key', '') !== '') {
            return true;
        }

        return $this->ollama->isAvailable();
    }

    /**
     * Main page: describe problem and get suggestions.
     */
    public function index(Request $request): Response
    {
        $ollamaAvailable = $this->aiProviderReady();
        $recentSessions = [];
        try {
            $recentSessions = AlgorithmSession::query()
                ->where('user_id', $request->user()?->id)
                ->latest()
                ->take(10)
                ->get(['id', 'problem', 'recommendation', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'problem_preview' => Str::limit($s->problem, 80),
                    'recommendation_preview' => $s->recommendation ? Str::limit($s->recommendation, 100) : null,
                    'created_at' => $s->created_at->diffForHumans(),
                ])
                ->all();
        } catch (\Throwable $e) {
            Log::warning('algorithm_sessions list failed', [
                'user_id' => $request->user()?->id,
                'message' => $e->getMessage(),
            ]);
        }

        $recentCodeforces = [];
        try {
            $recentCodeforces = CodeforcesSolution::query()
                ->where('user_id', $request->user()?->id)
                ->latest()
                ->take(5)
                ->get(['id', 'problem_text', 'status', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'problem_preview' => Str::limit($s->problem_text, 80),
                    'status' => $s->status,
                    'created_at' => $s->created_at->diffForHumans(),
                ])
                ->all();
        } catch (\Throwable $e) {
            Log::warning('codeforces_solutions list failed', [
                'user_id' => $request->user()?->id,
                'message' => $e->getMessage(),
            ]);
        }

        return Inertia::render('Home', [
            'ollamaAvailable' => $ollamaAvailable,
            'recentSessions' => $recentSessions,
            'recentCodeforces' => $recentCodeforces,
            'flash' => [
                'message' => $request->session()->get('message'),
            ],
        ]);
    }

    /**
     * Analyze problem and suggest algorithms.
     */
    public function suggest(SuggestProblemRequest $request): Response
    {
        $problem = $request->validated('problem');

        try {
            $suggestions = $this->suggestAlgorithms->handle($problem);
        } catch (\Throwable $e) {
            Log::warning('algorithm.suggest.failed', [
                'user_id' => $request->user()?->id,
                'provider' => $this->suggestAlgorithms->providerName(),
                'failure_category' => 'provider_failure',
            ]);
            $this->usage()->record(
                $request->user()?->id,
                AiUsageService::FEATURE_ALGORITHM_SUGGEST,
                'failed',
                $this->suggestAlgorithms->providerName(),
                $this->suggestAlgorithms->providerModel(),
                null,
                null,
                'provider_failure',
            );

            return back()->withErrors(['ollama' => 'Unable to contact the AI provider. Configure OpenAI or start Ollama, then try again.']);
        }

        $this->usage()->record(
            $request->user()?->id,
            AiUsageService::FEATURE_ALGORITHM_SUGGEST,
            'completed',
            $this->suggestAlgorithms->providerName(),
            $this->suggestAlgorithms->providerModel(),
        );

        return Inertia::render('Suggestions', [
            'problem' => $problem,
            'suggestions' => $suggestions,
            'ollamaAvailable' => $this->aiProviderReady(),
        ]);
    }

    /**
     * Run benchmarks for suggested algorithms and get recommendation.
     */
    public function benchmark(BenchmarkRunRequest $request): Response
    {
        $problem = $request->validated('problem');
        $suggestions = $request->validated('suggestions');

        $workflow = $this->benchmarkWorkflow->handle(
            $request->user()?->id,
            $problem,
            $suggestions
        );

        return Inertia::render('Results', [
            'problem' => $problem,
            'suggestions' => $suggestions,
            'benchmarkResults' => $workflow['results'],
            'recommendation' => $workflow['recommendation'],
            'sessionId' => $workflow['session']?->id,
        ]);
    }

    /**
     * Show a saved session (past result).
     */
    public function showSession(Request $request, int $id): Response
    {
        $session = AlgorithmSession::query()->findOrFail($id);
        $this->authorize('view', $session);

        return Inertia::render('Results', [
            'problem' => $session->problem,
            'suggestions' => $session->suggestions ?? [],
            'benchmarkResults' => $session->benchmark_results ?? [],
            'recommendation' => $session->recommendation ?? '',
            'sessionId' => $session->id,
        ]);
    }

    private function usage(): AiUsageService
    {
        return $this->usage ??= app(AiUsageService::class);
    }
}
