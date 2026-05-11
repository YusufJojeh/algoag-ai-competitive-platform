<?php

namespace App\Modules\Problems\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProblemController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Problem::class);

        $problems = Problem::query()
            ->with('tags')
            ->orderBy('title')
            ->get()
            ->map(fn (Problem $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'difficulty' => $p->difficulty,
                'tags' => $p->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name])->all(),
            ])
            ->all();

        return Inertia::render('Problems/Index', [
            'problems' => $problems,
        ]);
    }

    public function show(Request $request, Problem $problem): Response
    {
        $this->authorize('view', $problem);

        $problem->load('tags');

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
        ]);
    }
}
