<?php

namespace App\Http\Controllers;

use App\Http\Requests\CodeforcesSolveRequest;
use App\Models\CodeforcesSolution;
use App\Modules\Codeforces\Actions\QueueCodeforcesSolutionAction;
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
        protected QueueCodeforcesSolutionAction $queueSolution
    ) {}

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
                ->get(['id', 'problem_text', 'status', 'created_at'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'problem_preview' => Str::limit($s->problem_text, 100),
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
            'ollamaAvailable' => $this->ollama->isAvailable(),
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
        $language = $request->validated('language', 'cpp');

        if (! $this->ollama->isAvailable()) {
            return back()->withErrors(['ollama' => 'تعذر الاتصال بـ Ollama. شغّل ollama serve ثم ollama pull نموذجاً مناسباً.']);
        }

        $queued = $this->queueSolution->handle(
            $request->user()->id,
            $problem,
            $language
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
                'parsed_problem' => $solution->parsed_problem,
                'solution_code' => $solution->solution_code,
                'solution_language' => $solution->solution_language,
                'explanation' => $solution->explanation,
                'generated_tests' => $solution->generated_tests ?? [],
                'run_results' => $solution->run_results,
                'algorithm_breakdown' => $solution->algorithm_breakdown,
                'status' => $solution->status,
                'error_message' => $solution->error_message,
                'created_at' => $solution->created_at?->toIso8601String(),
            ],
            'statusPollUrl' => route('solve.result.status', ['id' => $solution->id]),
        ]);
    }
}
