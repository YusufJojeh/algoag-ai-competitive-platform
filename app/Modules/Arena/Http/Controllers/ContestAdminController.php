<?php

namespace App\Modules\Arena\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContestRequest;
use App\Http\Requests\Admin\UpdateContestRequest;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContestAdminController extends Controller
{
    public function index(): Response
    {
        $contests = Contest::query()
            ->withCount('problems')
            ->orderByDesc('starts_at')
            ->paginate(50, ['id', 'title', 'slug', 'starts_at', 'ends_at', 'is_public', 'is_practice', 'problems_published_at']);

        return Inertia::render('Admin/Contests/Index', [
            'contests' => $contests,
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Contests/Create', [
            'availableProblems' => $this->availableProblems(),
            'scheduling' => $this->schedulingProps(),
        ]);
    }

    public function store(StoreContestRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $contest = Contest::query()->create($this->contestAttributes($validated, $request));
        $this->syncProblems($contest, $validated['problems'] ?? [], $validated['contest_only_problems'] ?? []);

        return redirect()->route('admin.contests.index')->with('message', 'Contest created.');
    }

    public function edit(Contest $contest): Response
    {
        $contest->load(['problems.testCases']);
        $regularProblems = [];
        $contestOnlyProblems = [];

        foreach ($contest->problems as $problem) {
            if (! $problem->is_public && (int) $problem->published_from_contest_id === (int) $contest->id) {
                $contestOnlyProblems[] = [
                    'id' => $problem->id,
                    'label' => $problem->pivot->label,
                    'title' => $problem->title,
                    'statement' => $problem->statement,
                    'difficulty' => $problem->difficulty,
                    'time_limit_ms' => $problem->time_limit_ms,
                    'memory_limit_mb' => $problem->memory_limit_mb,
                    'test_cases' => $problem->testCases->map(fn ($tc) => [
                        'input' => $tc->input,
                        'expected_output' => $tc->expected_output,
                        'is_sample' => (bool) $tc->is_sample,
                    ])->all(),
                ];

                continue;
            }

            $regularProblems[] = [
                'problem_id' => $problem->id,
                'label' => $problem->pivot->label,
            ];
        }

        $duration = $this->durationParts($contest);

        return Inertia::render('Admin/Contests/Edit', [
            'contest' => [
                'id' => $contest->id,
                'title' => $contest->title,
                'slug' => $contest->slug,
                'description' => $contest->description,
                'starts_at' => $this->dateTimeLocal($contest->starts_at),
                'ends_at' => $this->dateTimeLocal($contest->ends_at),
                'duration_hours' => $duration['hours'],
                'duration_minutes' => $duration['minutes'],
                'is_public' => (bool) $contest->is_public,
                'is_practice' => (bool) $contest->is_practice,
                'problems_published_at' => $contest->problems_published_at?->toIso8601String(),
                'problems' => $regularProblems,
                'contest_only_problems' => $contestOnlyProblems,
            ],
            'availableProblems' => $this->availableProblems(),
            'scheduling' => $this->schedulingProps(),
        ]);
    }

    public function update(UpdateContestRequest $request, Contest $contest): RedirectResponse
    {
        $validated = $request->validated();
        $contest->update($this->contestAttributes($validated, $request));
        $this->syncProblems($contest, $validated['problems'] ?? [], $validated['contest_only_problems'] ?? []);

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
        $isPractice = (bool) ($validated['is_practice'] ?? false);
        $startsAt = $validated['starts_at'] ?? null;

        return [
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'starts_at' => $startsAt,
            'ends_at' => $isPractice ? null : $this->calculateEndsAt($startsAt, $validated),
            'is_public' => (bool) ($validated['is_public'] ?? false),
            'is_practice' => $isPractice,
            'created_by' => $request->user()->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function calculateEndsAt(?string $startsAt, array $validated): ?Carbon
    {
        if (! $startsAt) {
            return null;
        }

        $totalMinutes = ((int) ($validated['duration_hours'] ?? 0) * 60)
            + (int) ($validated['duration_minutes'] ?? 0);

        return Carbon::parse($startsAt, config('app.timezone'))->addMinutes($totalMinutes);
    }

    private function dateTimeLocal(?\Carbon\CarbonInterface $date): ?string
    {
        return $date?->timezone(config('app.timezone'))->format('Y-m-d\TH:i');
    }

    /**
     * @return array{timezone: string, server_now: string, minimum_starts_at: string}
     */
    private function schedulingProps(): array
    {
        $timezone = config('app.timezone');
        $now = now($timezone)->seconds(0);

        return [
            'timezone' => $timezone,
            'server_now' => $now->format('Y-m-d\TH:i'),
            'minimum_starts_at' => $now->copy()->addMinutes(2)->format('Y-m-d\TH:i'),
        ];
    }

    /**
     * @return array{hours: int, minutes: int}
     */
    private function durationParts(Contest $contest): array
    {
        if (! $contest->starts_at || ! $contest->ends_at || $contest->ends_at->lessThanOrEqualTo($contest->starts_at)) {
            return ['hours' => 0, 'minutes' => 0];
        }

        $totalMinutes = (int) $contest->starts_at->diffInMinutes($contest->ends_at);

        return [
            'hours' => intdiv($totalMinutes, 60),
            'minutes' => $totalMinutes % 60,
        ];
    }

    /**
     * Replace the contest's problem set, auto-labelling A, B, C... when no label is given.
     *
     * @param  array<int, array<string, mixed>>  $problems
     */
    private function syncProblems(Contest $contest, array $problems, array $contestOnlyProblems = []): void
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

        foreach ($contestOnlyProblems as $entry) {
            $title = trim((string) ($entry['title'] ?? ''));
            $statement = trim((string) ($entry['statement'] ?? ''));

            if ($title === '' || $statement === '') {
                continue;
            }

            $problemId = (int) ($entry['id'] ?? 0);
            $problem = $problemId > 0
                ? Problem::query()
                    ->whereKey($problemId)
                    ->where('is_public', false)
                    ->where('published_from_contest_id', $contest->id)
                    ->first()
                : null;

            $attributes = [
                'title' => $title,
                'statement' => $statement,
                'difficulty' => (string) ($entry['difficulty'] ?? 'easy'),
                'time_limit_ms' => (int) ($entry['time_limit_ms'] ?? 1000),
                'memory_limit_mb' => (int) ($entry['memory_limit_mb'] ?? 256),
                'is_public' => false,
                'published_at' => null,
                'published_from_contest_id' => $contest->id,
            ];

            if ($problem) {
                $problem->update($attributes);
                $problem->testCases()->delete();
            } else {
                $problem = Problem::query()->create([
                    ...$attributes,
                    'slug' => $this->uniqueProblemSlug($title, $contest, $ordinal),
                ]);
            }

            $this->syncTestCases($problem, $entry['test_cases'] ?? []);

            $label = trim((string) ($entry['label'] ?? '')) ?: chr(ord('A') + ($ordinal % 26));
            $contest->contestProblems()->create([
                'problem_id' => $problem->id,
                'label' => $label,
                'ordinal' => $ordinal++,
            ]);
        }
    }

    private function uniqueProblemSlug(string $title, Contest $contest, int $ordinal): string
    {
        $base = Str::slug($title) ?: 'contest-problem';
        $base = Str::limit($base.'-'.$contest->slug, 220, '');
        $suffix = $ordinal + 1;
        $candidate = "{$base}-{$suffix}";

        while (Problem::query()->where('slug', $candidate)->exists()) {
            $suffix++;
            $candidate = "{$base}-{$suffix}";
        }

        return $candidate;
    }

    /**
     * @param  array<int, array<string, mixed>>  $cases
     */
    private function syncTestCases(Problem $problem, array $cases): void
    {
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
     * @return array<int, array<string, mixed>>
     */
    private function availableProblems(): array
    {
        return Problem::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug', 'is_public', 'published_at', 'published_from_contest_id'])
            ->map(fn (Problem $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'is_public' => (bool) $p->is_public,
                'published_at' => $p->published_at?->toIso8601String(),
                'published_from_contest_id' => $p->published_from_contest_id,
            ])
            ->all();
    }
}
