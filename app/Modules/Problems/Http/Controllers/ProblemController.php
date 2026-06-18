<?php

namespace App\Modules\Problems\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProblemController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Problem::class);

        $topicSlug = $request->query('topic');
        $topic = is_string($topicSlug) && $topicSlug !== ''
            ? Tag::query()->where('slug', $topicSlug)->first()
            : null;

        $problems = Problem::query()
            ->public()
            ->with('tags')
            ->when($topic, fn ($query) => $query->whereHas('tags', fn ($tagQuery) => $tagQuery->whereKey($topic->id)))
            ->orderBy('title')
            ->get()
            ->map(fn (Problem $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'difficulty' => $p->difficulty,
                'time_label' => $p->published_at ? 'published' : 'created',
                'time_at' => ($p->published_at ?? $p->created_at)?->toIso8601String(),
                'tags' => $p->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name])->all(),
            ])
            ->all();

        return Inertia::render('Problems/Index', [
            'problems' => $problems,
            'filters' => [
                'topic' => $topic ? ['id' => $topic->id, 'name' => $topic->name, 'slug' => $topic->slug] : null,
            ],
        ]);
    }

    public function show(Request $request, Problem $problem): Response
    {
        $this->authorize('view', $problem);

        $problem->load('tags');

        // Optional contest context: only surfaced when the user can actually submit
        // into the contest (joined + the contest currently accepts submissions), so the
        // banner never leads to a dead-end 403. Otherwise the page behaves as a normal
        // (practice) submission with no contest_id.
        $contest = null;
        $contestSlug = $request->query('contest');
        if (is_string($contestSlug) && $contestSlug !== '') {
            $found = \App\Modules\Arena\Models\Contest::query()
                ->where('slug', $contestSlug)
                ->where('is_public', true)
                ->whereHas('problems', fn ($q) => $q->where('problems.id', $problem->id))
                ->first();

            if ($found
                && $found->hasParticipant((int) $request->user()->id)
                && $found->acceptsSubmissions()
            ) {
                $contest = ['id' => $found->id, 'slug' => $found->slug, 'title' => $found->title];
            }
        }

        return Inertia::render('Problems/Show', [
            'problem' => [
                'id' => $problem->id,
                'title' => $problem->title,
                'slug' => $problem->slug,
                'statement' => $problem->statement,
                'difficulty' => $problem->difficulty,
                'time_limit_ms' => $problem->time_limit_ms,
                'memory_limit_mb' => $problem->memory_limit_mb,
                'tags' => $problem->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name])->all(),
            ],
            'contest' => $contest,
        ]);
    }
}
