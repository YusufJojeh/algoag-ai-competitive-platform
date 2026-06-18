<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubmissionRequest;
use App\Jobs\ProcessSubmissionJob;
use App\Models\Submission;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Submission::class);

        $submissions = Submission::query()
            ->where('user_id', $request->user()->id)
            ->with('problem:id,title,slug')
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (Submission $s) => [
                'id' => $s->id,
                'language' => $s->language,
                'verdict' => $s->verdict,
                'status' => $s->status,
                'runtime_ms' => $s->runtime_ms,
                'created_at' => $s->created_at?->diffForHumans(),
                'problem' => $s->problem ? [
                    'id' => $s->problem->id,
                    'title' => $s->problem->title,
                    'slug' => $s->problem->slug,
                ] : null,
            ])
            ->all();

        return Inertia::render('Submissions/Index', [
            'submissions' => $submissions,
            'flash' => [
                'message' => $request->session()->get('message'),
            ],
        ]);
    }

    public function store(StoreSubmissionRequest $request): RedirectResponse
    {
        $this->authorize('create', Submission::class);

        $userId = (int) $request->user()->id;
        $problemId = $request->validated('problem_id');
        $contestId = $request->validated('contest_id');

        // Contest submissions are gated: the user must have joined, the problem must
        // belong to the contest, and the contest must currently accept submissions
        // (practice = anytime; timed = within the start/end window). Generic 403s,
        // consistent with the project's authorize() convention; no hidden-test details.
        if ($contestId !== null) {
            $contest = Contest::query()->findOrFail($contestId);
            $isAdmin = (bool) $request->user()->is_admin;

            abort_unless($contest->is_public || $isAdmin, 404);
            abort_unless($contest->hasParticipant($userId), 403, 'يجب الانضمام إلى المسابقة أولاً.');
            abort_unless($problemId !== null && $contest->hasProblem((int) $problemId), 403, 'هذه المسألة ليست ضمن المسابقة.');
            abort_unless($contest->acceptsSubmissions(), 403, 'المسابقة لا تقبل الإرسالات حالياً.');
        } elseif ($problemId !== null) {
            $problem = Problem::query()->findOrFail($problemId);
            abort_unless($problem->isPubliclyVisible() || $request->user()->is_admin, 404);
        }

        $submission = Submission::create([
            'user_id' => $userId,
            'problem_id' => $problemId,
            'contest_id' => $contestId,
            'language' => $request->validated('language'),
            'code' => $request->validated('code'),
            'verdict' => 'pending',
            'status' => Submission::STATUS_PENDING,
        ]);

        // Dispatch the local judge. Runs inline under the sync queue (local dev),
        // async under the database queue.
        ProcessSubmissionJob::dispatch($submission->id);

        return redirect()->route('submissions.show', $submission->id)
            ->with('message', 'تم استلام الإرسال رقم #'.$submission->id);
    }

    public function show(Request $request, Submission $submission): Response
    {
        $this->authorize('view', $submission);

        $submission->load(['problem:id,title,slug,time_limit_ms', 'problem.testCases']);

        // Map per-case verdicts onto the problem's cases, exposing input/expected
        // ONLY for public sample cases. Hidden test I/O is never sent to the client.
        $cases = collect($submission->per_case_results ?? [])->map(function (array $case) use ($submission) {
            $testCase = $submission->problem?->testCases->get($case['index'] ?? -1);
            $isSample = (bool) ($testCase?->is_sample);

            return [
                'index' => $case['index'] ?? null,
                'verdict' => $case['verdict'] ?? null,
                'runtime_ms' => $case['runtime_ms'] ?? null,
                'is_sample' => $isSample,
                'input' => $isSample ? (string) $testCase->input : null,
                'expected_output' => $isSample ? (string) $testCase->expected_output : null,
            ];
        })->all();

        return Inertia::render('Submissions/Show', [
            'submission' => [
                'id' => $submission->id,
                'language' => $submission->language,
                'verdict' => $submission->verdict,
                'status' => $submission->status,
                'runtime_ms' => $submission->runtime_ms,
                'code' => $submission->code,
                'message' => $submission->judge_meta['message'] ?? null,
                'created_at' => $submission->created_at?->diffForHumans(),
                'problem' => $submission->problem ? [
                    'id' => $submission->problem->id,
                    'title' => $submission->problem->title,
                    'slug' => $submission->problem->slug,
                ] : null,
                'cases' => $cases,
            ],
            'flash' => [
                'message' => $request->session()->get('message'),
            ],
        ]);
    }
}
