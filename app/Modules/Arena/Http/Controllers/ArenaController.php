<?php

namespace App\Modules\Arena\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Modules\Arena\Models\Contest;
use App\Modules\Arena\Models\ContestParticipant;
use App\Modules\Arena\Services\StandingService;
use App\Modules\Problems\Models\Problem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArenaController extends Controller
{
    public function index(Request $request): Response
    {
        $isAdmin = (bool) ($request->user()?->is_admin);

        $contests = Contest::query()
            ->when(! $isAdmin, fn ($q) => $q->where('is_public', true))
            ->withCount('problems')
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn (Contest $c) => [
                'slug' => $c->slug,
                'title' => $c->title,
                'description' => $c->description,
                'status' => $c->status(),
                'problems_count' => $c->problems_count,
                'starts_at' => $this->isoInAppTimezone($c->starts_at),
                'ends_at' => $this->isoInAppTimezone($c->ends_at),
            ])
            ->all();

        return Inertia::render('Arena/Index', [
            'contests' => $contests,
        ]);
    }

    public function show(Request $request, Contest $contest): Response
    {
        abort_unless($contest->is_public || $request->user()?->is_admin, 404);

        $contest->load('problems');
        $userId = $request->user()->id;
        $isAdmin = (bool) $request->user()?->is_admin;
        $joined = $contest->hasParticipant($userId);
        $canSeeContestProblemNames = $isAdmin || $joined;
        $canOpenContestProblems = $isAdmin || ($joined && $contest->allowsProblemViewing());

        // Best per-problem status for the current user within this contest.
        $statusByProblem = Submission::query()
            ->where('contest_id', $contest->id)
            ->where('user_id', $userId)
            ->orderBy('created_at')
            ->get(['problem_id', 'verdict'])
            ->groupBy('problem_id')
            ->map(function ($group) {
                $accepted = $group->firstWhere('verdict', 'accepted');

                return $accepted ? 'accepted' : ($group->last()->verdict ?? null);
            });

        $problems = $contest->problems
            ->filter(fn ($problem) => $problem->isPubliclyVisible() || $canSeeContestProblemNames)
            ->map(fn ($problem) => [
                'id' => $problem->id,
                'label' => $problem->pivot->label,
                'title' => $problem->title,
                'slug' => $problem->slug,
                'difficulty' => null,
                'can_open' => $canOpenContestProblems,
                'your_status' => $statusByProblem->get($problem->id),
            ])->values()->all();

        return Inertia::render('Arena/Show', [
            'contest' => [
                'id' => $contest->id,
                'slug' => $contest->slug,
                'title' => $contest->title,
                'description' => $contest->description,
                'status' => $contest->status(),
                'is_practice' => $contest->is_practice,
                'accepts_submissions' => $contest->acceptsSubmissions(),
                'starts_at' => $this->isoInAppTimezone($contest->starts_at),
                'ends_at' => $this->isoInAppTimezone($contest->ends_at),
            ],
            'joined' => $joined,
            'problems' => $problems,
        ]);
    }

    public function problem(Request $request, Contest $contest, Problem $problem): Response
    {
        abort_unless($contest->is_public || $request->user()?->is_admin, 404);
        abort_unless($contest->hasProblem((int) $problem->id), 404);

        $isAdmin = (bool) $request->user()?->is_admin;
        if (! $isAdmin) {
            abort_unless($contest->hasParticipant((int) $request->user()->id), 403);
            abort_unless($contest->allowsProblemViewing(), 403);
        }

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
            'contest' => [
                'id' => $contest->id,
                'slug' => $contest->slug,
                'title' => $contest->title,
            ],
        ]);
    }

    public function join(Request $request, Contest $contest): RedirectResponse
    {
        abort_unless($contest->is_public || $request->user()?->is_admin, 404);

        // Idempotent: joining twice does not create a duplicate participant.
        ContestParticipant::query()->firstOrCreate(
            ['contest_id' => $contest->id, 'user_id' => $request->user()->id],
            ['registered_at' => now(config('app.timezone'))],
        );

        return redirect()->back()->with('message', 'تم انضمامك إلى المسابقة.');
    }

    public function standings(Request $request, Contest $contest, StandingService $standings): Response
    {
        abort_unless($contest->is_public || $request->user()?->is_admin, 404);

        $contest->load('problems');

        $labels = $contest->problems->map(fn ($p) => [
            'id' => $p->id,
            'label' => $p->pivot->label,
        ])->all();

        $rows = collect($standings->standingsFor($contest))->map(fn (array $row) => [
            'rank' => $row['rank'],
            'user_name' => $row['user_name'],
            'solved' => $row['solved'],
            'penalty' => $row['penalty'],
            'problems' => collect($row['problems'])->map(fn (array $p, $problemId) => [
                'problem_id' => (int) $problemId,
                'accepted' => $p['accepted'],
                'wrong' => $p['wrong'],
            ])->values()->all(),
        ])->all();

        return Inertia::render('Arena/Standings', [
            'contest' => [
                'slug' => $contest->slug,
                'title' => $contest->title,
            ],
            'labels' => $labels,
            'rows' => $rows,
        ]);
    }

    private function isoInAppTimezone(?\Carbon\CarbonInterface $date): ?string
    {
        return $date?->timezone(config('app.timezone'))->toIso8601String();
    }
}
