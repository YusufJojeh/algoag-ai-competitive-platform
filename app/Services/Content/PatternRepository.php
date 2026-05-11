<?php

namespace App\Services\Content;

use App\Models\ContentIndexPattern;
use App\Services\Content\Dto\PatternDto;
use App\Services\Content\Exceptions\ContentNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class PatternRepository
{
    public function __construct(
        protected CpContentPaths $paths,
        protected ContentFileReader $reader,
        protected CpContentHasher $hasher
    ) {}

    /**
     * @return list<string>
     */
    public function listPatternSlugs(): array
    {
        $patterns = $this->paths->cpRoot().DIRECTORY_SEPARATOR.'patterns';
        if (! File::isDirectory($patterns)) {
            return [];
        }
        $slugs = [];
        foreach (glob($patterns.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR) ?: [] as $dir) {
            $slugs[] = basename($dir);
        }
        sort($slugs);

        return $slugs;
    }

    /**
     * Published pattern slugs from the content index (fast path). Falls back to empty if index disabled or empty.
     *
     * @return list<string>
     */
    public function listPublishedSlugsFromIndex(): array
    {
        if (! config('content.index_enabled')) {
            return [];
        }

        return ContentIndexPattern::query()
            ->where('status', 'published')
            ->orderBy('pattern_id')
            ->pluck('pattern_id')
            ->map(static fn (string $id) => $id)
            ->values()
            ->all();
    }

    public function getPattern(string $patternSlug): PatternDto
    {
        $path = $this->paths->patternManifestPath($patternSlug);
        if (! File::isFile($path)) {
            throw new ContentNotFoundException('Pattern not found: '.$patternSlug);
        }

        $hash = $this->hasher->hashFile($path);
        $key = 'cp:pattern:'.$patternSlug.':v'.$hash;
        $ttl = config('content.cache_ttl');

        $loader = function () use ($path): PatternDto {
            $data = $this->reader->readJson($path);

            return $this->mapPattern($data);
        };

        if ($ttl === null || $ttl === '') {
            return Cache::rememberForever($key, $loader);
        }

        return Cache::remember($key, (int) $ttl, $loader);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function mapPattern(array $data): PatternDto
    {
        $refs = [];
        if (is_array($data['representative_problem_refs'] ?? null)) {
            foreach ($data['representative_problem_refs'] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $ps = isset($row['pattern_slug']) ? (string) $row['pattern_slug'] : '';
                $qs = isset($row['problem_slug']) ? (string) $row['problem_slug'] : '';
                if ($ps !== '' && $qs !== '') {
                    $refs[] = ['pattern_slug' => $ps, 'problem_slug' => $qs];
                }
            }
        }

        $ollama = null;
        if (is_array($data['ollama_matching'] ?? null)) {
            $om = $data['ollama_matching'];
            $kw = is_array($om['keywords'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $om['keywords']))
                : [];
            $nkw = is_array($om['negative_keywords'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $om['negative_keywords']))
                : [];
            $notes = is_array($om['notes'] ?? null) ? $om['notes'] : [];
            $ollama = [
                'keywords' => $kw,
                'negative_keywords' => $nkw,
                'notes' => $notes,
            ];
        }

        $benchmarkKey = $data['benchmark_key'] ?? null;
        $benchmarkKey = is_string($benchmarkKey) && $benchmarkKey !== '' ? $benchmarkKey : null;

        return new PatternDto(
            schemaVersion: (int) ($data['schema_version'] ?? 0),
            patternId: (string) ($data['pattern_id'] ?? ''),
            status: (string) ($data['status'] ?? ''),
            title: is_array($data['title'] ?? null) ? $data['title'] : [],
            summary: is_array($data['summary'] ?? null) ? $data['summary'] : [],
            whenToUse: is_array($data['when_to_use'] ?? null) ? $data['when_to_use'] : [],
            whenNotToUse: is_array($data['when_not_to_use'] ?? null) ? $data['when_not_to_use'] : [],
            statementSignals: is_array($data['statement_signals'] ?? null) ? $data['statement_signals'] : [],
            relatedTechniques: is_array($data['related_techniques'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $data['related_techniques']))
                : [],
            relatedPatternIds: is_array($data['related_pattern_ids'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $data['related_pattern_ids']))
                : [],
            representativeProblemRefs: $refs,
            benchmarkKey: $benchmarkKey,
            ollamaMatching: $ollama,
            analyticsTags: is_array($data['analytics_tags'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $data['analytics_tags']))
                : [],
        );
    }
}
