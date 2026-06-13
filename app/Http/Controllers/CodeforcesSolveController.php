<?php

namespace App\Http\Controllers;

use App\Http\Requests\CodeforcesSolveRequest;
use App\Models\CodeforcesSolution;
use App\Modules\Codeforces\Actions\QueueCodeforcesSolutionAction;
use App\Services\AI\AiUsageService;
use App\Services\AI\QueueSafetyService;
use App\Services\OllamaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CodeforcesSolveController extends Controller
{
    public function __construct(
        protected OllamaService $ollama,
        protected QueueCodeforcesSolutionAction $queueSolution,
        protected AiUsageService $usage,
        protected QueueSafetyService $queueSafety,
    ) {}

    /**
     * Whether a usable text-generation provider is reachable. OpenAI (primary,
     * with a key) needs no local service; otherwise fall back to checking Ollama.
     */
    protected function aiProviderReady(): bool
    {
        $primary = strtolower((string) config('services.ai.primary', 'openai'));
        if ($primary === 'openai' && (string) config('services.ai.openai.api_key', '') !== '') {
            return true;
        }

        return $this->ollama->isAvailable();
    }

    /**
     * Show the form: paste Codeforces problem text and submit.
     */
    public function index(Request $request): Response
    {
        $this->authorize('create', CodeforcesSolution::class);

        $recent = [];
        try {
            $recent = CodeforcesSolution::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->take(10)
                ->get(['id', 'problem_text', 'problem_text_translations', 'parsed_problem', 'parsed_problem_translations', 'status', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'problem_title' => $this->localizedProblemTitle($s, app()->getLocale()),
                    'problem_preview' => Str::limit($this->localizedProblemText($s, app()->getLocale()), 100),
                    'status' => $s->status,
                    'created_at' => $s->created_at->diffForHumans(),
                ])
                ->all();
        } catch (\Throwable $e) {
            Log::warning('codeforces_solutions list failed', [
                'user_id' => $request->user()->id,
                'message' => $e->getMessage(),
            ]);
        }

        return Inertia::render('CodeforcesSolve', [
            'ollamaAvailable' => $this->aiProviderReady(),
            'recentSolutions' => $recent,
            'flash' => [
                'message' => $request->session()->get('message'),
            ],
        ]);
    }

    /**
     * Queue the solver pipeline and redirect to result.
     */
    public function solve(CodeforcesSolveRequest $request): RedirectResponse
    {
        $this->authorize('create', CodeforcesSolution::class);

        $problem = $request->validated('problem');
        $language = $request->validated('language', 'python');
        $responseLanguage = $request->validated('response_language') ?? app()->getLocale();

        // Only require Ollama when it is actually the active provider. With
        // OpenAI configured as primary the solve runs without Ollama running.
        if (! $this->aiProviderReady()) {
            return back()->withErrors(['ollama' => 'تعذر الاتصال بمزود الذكاء الاصطناعي. فعّل OpenAI بإضافة OPENAI_API_KEY، أو شغّل Ollama عبر ollama serve ثم ollama pull نموذجاً مناسباً.']);
        }

        try {
            $this->queueSafety->assertLongRunningQueueSafe();
            $this->usage->assertWithinLimit($request->user(), AiUsageService::FEATURE_CODEFORCES_SOLVE);
        } catch (\RuntimeException $e) {
            return back()->withErrors([
                'queue' => $e->getMessage() === 'AI usage limit reached.'
                    ? 'AI usage limit reached. Try again later.'
                    : 'AI processing is not configured for background execution.',
            ]);
        }

        $queued = $this->queueSolution->handle(
            $request->user()->id,
            $problem,
            $language,
            $responseLanguage === 'en' ? 'en' : 'ar'
        );

        return redirect()->route('solve.result', ['id' => $queued['solution']->id]);
    }

    /**
     * JSON status for polling while the job runs.
     */
    public function resultStatus(Request $request, int $id): JsonResponse
    {
        $solution = CodeforcesSolution::query()->findOrFail($id);
        $this->authorize('view', $solution);

        return response()->json([
            'status' => $solution->status,
            'progress_stage' => $solution->progress_stage,
            'error_message' => $solution->error_message,
        ]);
    }

    /**
     * Show full result for a solution.
     */
    public function showResult(Request $request, int $id): Response
    {
        $solution = CodeforcesSolution::query()->findOrFail($id);
        $this->authorize('view', $solution);

        return Inertia::render('CodeforcesResult', [
            'solution' => [
                'id' => $solution->id,
                'problem_text' => $solution->problem_text,
                'problem_text_translations' => $solution->problem_text_translations,
                'parsed_problem' => $solution->parsed_problem,
                'parsed_problem_translations' => $solution->parsed_problem_translations,
                'solution_code' => $solution->solution_code,
                'solution_language' => $solution->solution_language,
                'response_language' => $solution->response_language,
                'explanation' => $solution->explanation,
                'explanation_translations' => $solution->explanation_translations,
                'generated_tests' => $solution->generated_tests ?? [],
                'run_results' => $solution->run_results,
                'algorithm_breakdown' => $solution->algorithm_breakdown,
                'algorithm_breakdown_translations' => $solution->algorithm_breakdown_translations,
                'status' => $solution->status,
                'progress_stage' => $solution->progress_stage,
                'error_message' => $solution->error_message,
                'created_at' => $solution->created_at?->toIso8601String(),
            ],
            'statusPollUrl' => route('solve.result.status', ['id' => $solution->id]),
        ]);
    }

    protected function localizedProblemTitle(CodeforcesSolution $solution, string $locale): string
    {
        $locale = $locale === 'en' ? 'en' : 'ar';
        $localized = $solution->parsed_problem_translations[$locale] ?? null;
        if (is_array($localized) && trim((string) ($localized['title'] ?? '')) !== '') {
            return (string) $localized['title'];
        }

        $parsed = $solution->parsed_problem;
        if (is_array($parsed) && trim((string) ($parsed['title'] ?? '')) !== '') {
            return (string) $parsed['title'];
        }

        return '';
    }

    protected function localizedProblemText(CodeforcesSolution $solution, string $locale): string
    {
        $locale = $locale === 'en' ? 'en' : 'ar';
        $localized = $solution->problem_text_translations[$locale] ?? null;
        if (is_string($localized) && trim($localized) !== '') {
            return $localized;
        }

        $parsed = $solution->parsed_problem_translations[$locale] ?? null;
        if (is_array($parsed)) {
            $text = trim(implode("\n\n", array_filter([
                (string) ($parsed['title'] ?? ''),
                (string) ($parsed['description'] ?? ''),
            ])));
            if ($text !== '') {
                return $text;
            }
        }

        return (string) $solution->problem_text;
    }
}
