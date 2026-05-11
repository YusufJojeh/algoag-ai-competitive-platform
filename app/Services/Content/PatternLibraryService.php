<?php

namespace App\Services\Content;

use App\Models\ContentIndexPattern;
use App\Models\ContentIndexProblem;
use App\Modules\Problems\Models\Problem;
use App\Services\Content\Dto\PatternDto;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;

class PatternLibraryService
{
    public function __construct(
        protected PatternRepository $patterns
    ) {}

    /**
     * Distinct analytics tags from published indexed patterns (for filter UI).
     *
     * @return list<string>
     */
    public function listPublishedAnalyticsTags(): array
    {
        if (! config('content.index_enabled')) {
            return [];
        }

        $tags = ContentIndexPattern::query()
            ->where('status', 'published')
            ->pluck('analytics_tags')
            ->filter()
            ->flatten()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return array_values(array_map(static fn ($t) => (string) $t, $tags));
    }

    /**
     * @param  array{q?: string, status?: string, tag?: string, per_page?: int}  $filters
     */
    public function listPatterns(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));

        if (! config('content.index_enabled')) {
            return new Paginator([], 0, $perPage, 1, ['path' => request()->url(), 'query' => request()->query()]);
        }

        $query = ContentIndexPattern::query()->orderBy('pattern_id');

        $status = $filters['status'] ?? 'published';
        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $tag = isset($filters['tag']) ? trim((string) $filters['tag']) : '';
        if ($tag !== '') {
            $query->whereJsonContains('analytics_tags', $tag);
        }

        $q = isset($filters['q']) ? trim((string) $filters['q']) : '';
        if ($q !== '') {
            $needle = '%'.addcslashes($q, '%_\\').'%';
            $query->where(function ($w) use ($needle): void {
                $w->where('search_text', 'like', $needle)
                    ->orWhere('pattern_id', 'like', $needle)
                    ->orWhere('title_ar', 'like', $needle)
                    ->orWhere('title_en', 'like', $needle)
                    ->orWhere('summary_ar', 'like', $needle)
                    ->orWhere('summary_en', 'like', $needle);
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * @return array{
     *   pattern: array<string, mixed>,
     *   related_patterns: list<array<string, mixed>>,
     *   representative_problems: list<array<string, mixed>>
     * }
     */
    public function getPatternDetail(string $patternSlug): array
    {
        $dto = $this->patterns->getPattern($patternSlug);

        $related = [];
        if ($dto->relatedPatternIds !== []) {
            $related = ContentIndexPattern::query()
                ->whereIn('pattern_id', $dto->relatedPatternIds)
                ->orderBy('pattern_id')
                ->get()
                ->map(fn (ContentIndexPattern $p) => $this->relatedPatternCard($p))
                ->values()
                ->all();
        }

        $representative = $this->buildRepresentativeProblems($dto);

        return [
            'pattern' => $dto->toArray(),
            'related_patterns' => $related,
            'representative_problems' => $representative,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function relatedPatternCard(ContentIndexPattern $p): array
    {
        return [
            'pattern_id' => $p->pattern_id,
            'status' => $p->status,
            'title' => [
                'ar' => $p->title_ar ?? '',
                'en' => $p->title_en ?? '',
            ],
            'summary' => [
                'ar' => $p->summary_ar ?? '',
                'en' => $p->summary_en ?? '',
            ],
            'href' => route('patterns.show', ['pattern' => $p->pattern_id]),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function buildRepresentativeProblems(PatternDto $dto): array
    {
        $patternId = $dto->patternId;
        $out = [];
        $seen = [];

        foreach ($dto->representativeProblemRefs as $ref) {
            $ps = $ref['pattern_slug'];
            $qs = $ref['problem_slug'];
            $indexed = ContentIndexProblem::query()
                ->where('slug', $qs)
                ->whereJsonContains('pattern_ids', $ps)
                ->first();

            $row = $this->representativeProblemRow($indexed, $qs, $ps, 'explicit');
            $seen[$row['problem_id']] = true;
            $out[] = $row;
        }

        if (! config('content.index_enabled')) {
            return $out;
        }

        $indexedRest = ContentIndexProblem::query()
            ->whereJsonContains('pattern_ids', $patternId)
            ->orderBy('title_en')
            ->get();

        foreach ($indexedRest as $p) {
            if (isset($seen[$p->problem_id])) {
                continue;
            }
            $out[] = $this->representativeProblemRow($p, $p->slug, $patternId, 'indexed');
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    protected function representativeProblemRow(
        ?ContentIndexProblem $indexed,
        string $problemSlug,
        string $folderPatternSlug,
        string $source
    ): array {
        $problemId = $indexed->problem_id ?? $problemSlug;
        $slug = $indexed->slug ?? $problemSlug;
        $dbId = Problem::query()->where('slug', $slug)->value('id');

        return [
            'problem_id' => $problemId,
            'slug' => $slug,
            'title_ar' => $indexed?->title_ar,
            'title_en' => $indexed?->title_en,
            'status' => $indexed?->status,
            'pattern_ids' => $indexed !== null ? ($indexed->pattern_ids ?? []) : [$folderPatternSlug],
            'source' => $source,
            'db_problem_id' => $dbId,
            'href' => $dbId !== null ? route('problems.show', ['problem' => $dbId]) : null,
            'content_path' => 'content/cp/problems/'.$folderPatternSlug.'/'.$slug,
        ];
    }
}
