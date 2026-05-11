<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProblemRequest;
use App\Http\Requests\Admin\UpdateProblemRequest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProblemAdminController extends Controller
{
    public function index(): Response
    {
        $problems = Problem::query()
            ->orderBy('title')
            ->paginate(50, ['id', 'title', 'slug', 'difficulty', 'created_at']);

        return Inertia::render('Admin/Problems/Index', [
            'problems' => $problems,
            'flash' => [
                'message' => session('message'),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Problem::class);

        return Inertia::render('Admin/Problems/Create');
    }

    public function store(StoreProblemRequest $request): RedirectResponse
    {
        $this->authorize('create', Problem::class);
        Problem::query()->create($request->validated());

        return redirect()->route('admin.problems.index')->with('message', 'تم إنشاء المسألة.');
    }

    public function edit(Problem $problem): Response
    {
        $this->authorize('update', $problem);

        return Inertia::render('Admin/Problems/Edit', [
            'problem' => [
                'id' => $problem->id,
                'title' => $problem->title,
                'slug' => $problem->slug,
                'statement' => $problem->statement,
                'difficulty' => $problem->difficulty,
                'time_limit_ms' => $problem->time_limit_ms,
                'memory_limit_mb' => $problem->memory_limit_mb,
            ],
        ]);
    }

    public function update(UpdateProblemRequest $request, Problem $problem): RedirectResponse
    {
        $this->authorize('update', $problem);
        $problem->update($request->validated());

        return redirect()->route('admin.problems.index')->with('message', 'تم تحديث المسألة.');
    }

    public function destroy(Problem $problem): RedirectResponse
    {
        $this->authorize('delete', $problem);
        $problem->delete();

        return redirect()->route('admin.problems.index')->with('message', 'تم حذف المسألة.');
    }
}
