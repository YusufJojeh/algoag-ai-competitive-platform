<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubmissionRequest;
use App\Models\Submission;
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

        $submission = Submission::create([
            'user_id' => $request->user()->id,
            'problem_id' => $request->validated('problem_id'),
            'language' => $request->validated('language'),
            'code' => $request->validated('code'),
            'verdict' => 'stub_reviewed',
            'judge_meta' => [
                'engine' => 'stub',
                'message' => 'لا يوجد تنفيذ معزول؛ الإرسال مسجّل للتتبع فقط.',
            ],
        ]);

        return redirect()->route('submissions.index')
            ->with('message', 'تم استلام الإرسال رقم #'.$submission->id);
    }
}
