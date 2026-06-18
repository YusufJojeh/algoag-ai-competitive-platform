<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProblemRequest;
use App\Http\Requests\Admin\UpdateProblemRequest;
use App\Models\Tag;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProblemAdminController extends Controller
{
    public function index(): Response
    {
        $problems = Problem::query()
            ->with('tags')
            ->orderBy('title')
            ->paginate(50, ['id', 'title', 'slug', 'difficulty', 'is_public', 'published_at', 'published_from_contest_id', 'created_at']);

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

        return Inertia::render('Admin/Problems/Create', [
            'tags' => $this->availableTags(),
        ]);
    }

    public function store(StoreProblemRequest $request): RedirectResponse
    {
        $this->authorize('create', Problem::class);

        $validated = $request->validated();
        $problem = Problem::query()->create([
            ...$this->problemAttributes($validated),
            'is_public' => true,
            'published_at' => now(),
        ]);
        $this->syncTestCases($problem, $validated['test_cases'] ?? []);
        $problem->tags()->sync($validated['tag_ids'] ?? []);

        return redirect()->route('admin.problems.index')->with('message', 'Problem created.');
    }

    public function edit(Problem $problem): Response
    {
        $this->authorize('update', $problem);

        $problem->load(['testCases', 'tags']);

        return Inertia::render('Admin/Problems/Edit', [
            'problem' => [
                'id' => $problem->id,
                'title' => $problem->title,
                'slug' => $problem->slug,
                'statement' => $problem->statement,
                'difficulty' => $problem->difficulty,
                'is_public' => (bool) $problem->is_public,
                'published_at' => $problem->published_at?->toIso8601String(),
                'published_from_contest_id' => $problem->published_from_contest_id,
                'time_limit_ms' => $problem->time_limit_ms,
                'memory_limit_mb' => $problem->memory_limit_mb,
                'tag_ids' => $problem->tags->pluck('id')->all(),
                'test_cases' => $problem->testCases->map(fn ($tc) => [
                    'input' => $tc->input,
                    'expected_output' => $tc->expected_output,
                    'is_sample' => (bool) $tc->is_sample,
                ])->all(),
            ],
            'tags' => $this->availableTags(),
        ]);
    }

    public function update(UpdateProblemRequest $request, Problem $problem): RedirectResponse
    {
        $this->authorize('update', $problem);

        $validated = $request->validated();
        $problem->update($this->problemAttributes($validated));
        $this->syncTestCases($problem, $validated['test_cases'] ?? []);
        $problem->tags()->sync($validated['tag_ids'] ?? []);

        return redirect()->route('admin.problems.index')->with('message', 'Problem updated.');
    }

    public function destroy(Problem $problem): RedirectResponse
    {
        $this->authorize('delete', $problem);
        $problem->delete();

        return redirect()->route('admin.problems.index')->with('message', 'Problem deleted.');
    }

    /**
     * Pull only the Problem columns out of the validated payload (excludes test_cases).
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function problemAttributes(array $validated): array
    {
        return collect($validated)->only([
            'title', 'slug', 'statement', 'difficulty', 'time_limit_ms', 'memory_limit_mb',
        ])->all();
    }

    /**
     * Replace the problem's test cases with the submitted set (ordinal = position).
     * Skips fully-empty rows so trailing blanks in the editor are ignored.
     *
     * @param  array<int, array<string, mixed>>  $cases
     */
    private function syncTestCases(Problem $problem, array $cases): void
    {
        $problem->testCases()->delete();

        $ordinal = 0;
        foreach ($cases as $case) {
            $input = (string) ($case['input'] ?? '');
            $expected = (string) ($case['expected_output'] ?? '');

            if (trim($input) === '' && trim($expected) === '') {
                continue;
            }

            $problem->testCases()->create([
                'ordinal' => $ordinal++,
                'input' => $input,
                'expected_output' => $expected,
                'is_sample' => (bool) ($case['is_sample'] ?? false),
            ]);
        }
    }

    /**
     * @return array<int, array{id: int, name: string, slug: string}>
     */
    private function availableTags(): array
    {
        return Tag::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ])
            ->all();
    }
}
