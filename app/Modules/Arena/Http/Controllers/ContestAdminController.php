<?php

namespace App\Modules\Arena\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContestRequest;
use App\Http\Requests\Admin\UpdateContestRequest;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContestAdminController extends Controller
{
    public function index(): Response
    {
        $contests = Contest::query()
            ->withCount('problems')
            ->orderByDesc('starts_at')
            ->paginate(50, ['id', 'title', 'slug', 'starts_at', 'ends_at', 'is_public']);

        return Inertia::render('Admin/Contests/Index', [
            'contests' => $contests,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Contests/Create', [
            'availableProblems' => $this->availableProblems(),
        ]);
    }

    public function store(StoreContestRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $contest = Contest::query()->create($this->contestAttributes($validated, $request));
        $this->syncProblems($contest, $validated['problems'] ?? []);

        return redirect()->route('admin.contests.index')->with('message', 'Contest created.');
    }

    public function edit(Contest $contest): Response
    {
        $contest->load('problems');

        return Inertia::render('Admin/Contests/Edit', [
            'contest' => [
                'id' => $contest->id,
                'title' => $contest->title,
                'slug' => $contest->slug,
                'description' => $contest->description,
                'starts_at' => $contest->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $contest->ends_at?->format('Y-m-d\TH:i'),
                'is_public' => (bool) $contest->is_public,
                'problems' => $contest->problems->map(fn ($p) => [
                    'problem_id' => $p->id,
                    'label' => $p->pivot->label,
                ])->all(),
            ],
            'availableProblems' => $this->availableProblems(),
        ]);
    }

    public function update(UpdateContestRequest $request, Contest $contest): RedirectResponse
    {
        $validated = $request->validated();
        $contest->update($this->contestAttributes($validated, $request));
        $this->syncProblems($contest, $validated['problems'] ?? []);

        return redirect()->route('admin.contests.index')->with('message', 'Contest updated.');
    }

    public function destroy(Contest $contest): RedirectResponse
    {
        $contest->delete();

        return redirect()->route('admin.contests.index')->with('message', 'Contest deleted.');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function contestAttributes(array $validated, $request): array
    {
        return [
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'is_public' => (bool) ($validated['is_public'] ?? false),
            'created_by' => $request->user()->id,
        ];
    }

    /**
     * Replace the contest's problem set, auto-labelling A, B, C... when no label is given.
     *
     * @param  array<int, array<string, mixed>>  $problems
     */
    private function syncProblems(Contest $contest, array $problems): void
    {
        $contest->contestProblems()->delete();

        $ordinal = 0;
        $seen = [];
        foreach ($problems as $entry) {
            $problemId = (int) ($entry['problem_id'] ?? 0);
            if ($problemId === 0 || isset($seen[$problemId])) {
                continue; // skip blanks and duplicates (unique constraint)
            }
            $seen[$problemId] = true;

            $label = trim((string) ($entry['label'] ?? '')) ?: chr(ord('A') + ($ordinal % 26));

            $contest->contestProblems()->create([
                'problem_id' => $problemId,
                'label' => $label,
                'ordinal' => $ordinal++,
            ]);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function availableProblems(): array
    {
        return Problem::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug'])
            ->map(fn (Problem $p) => ['id' => $p->id, 'title' => $p->title, 'slug' => $p->slug])
            ->all();
    }
}
