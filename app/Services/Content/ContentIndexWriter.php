<?php

namespace App\Services\Content;

use App\Models\ContentIndexPattern;
use App\Models\ContentIndexProblem;
use Illuminate\Support\Facades\File;

class ContentIndexWriter
{
    public function __construct(
        protected CpContentPaths $paths,
        protected ContentFileReader $reader,
        protected CpContentHasher $hasher
    ) {}

    /**
     * @return array{patterns: int, problems: int}
     */
    public function sync(?string $gitSha, bool $dryRun = false): array
    {
        $patternCount = 0;
        $problemCount = 0;

        foreach ($this->listPatternManifestPaths() as $path) {
            $data = $this->reader->readJson($path);
            $patternId = (string) ($data['pattern_id'] ?? '');
            if ($patternId === '') {
                continue;
            }
            $hash = $this->hasher->hashFile($path);
            $titles = is_array($data['title'] ?? null) ? $data['title'] : [];
            $summaries = is_array($data['summary'] ?? null) ? $data['summary'] : [];
            $tags = is_array($data['analytics_tags'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $data['analytics_tags']))
                : [];
            $searchText = self::buildPatternSearchText($titles, $summaries, $tags);
            $payload = [
                'pattern_id' => $patternId,
                'status' => (string) ($data['status'] ?? 'draft'),
                'title_ar' => isset($titles['ar']) ? (string) $titles['ar'] : null,
                'title_en' => isset($titles['en']) ? (string) $titles['en'] : null,
                'summary_ar' => isset($summaries['ar']) ? (string) $summaries['ar'] : null,
                'summary_en' => isset($summaries['en']) ? (string) $summaries['en'] : null,
                'analytics_tags' => $tags === [] ? null : $tags,
                'search_text' => $searchText,
                'content_hash' => $hash,
                'git_sha' => $gitSha,
            ];
            if (! $dryRun) {
                ContentIndexPattern::query()->updateOrCreate(
                    ['pattern_id' => $patternId],
                    $payload
                );
            }
            $patternCount++;
        }

        foreach ($this->discoverProblemJsonPaths() as $path) {
            $dir = dirname($path);
            $data = $this->reader->readJson($path);
            $problemId = (string) ($data['problem_id'] ?? '');
            if ($problemId === '') {
                continue;
            }
            $slug = (string) ($data['slug'] ?? $problemId);
            $hash = $this->hasher->hashProblemDirectory($dir);
            $titles = is_array($data['titles'] ?? null) ? $data['titles'] : [];
            $locales = is_array($data['supported_locales'] ?? null) ? $data['supported_locales'] : [];
            $flags = [];
            foreach ($locales as $loc) {
                if (is_string($loc)) {
                    $flags[$loc] = true;
                }
            }
            $patternIds = is_array($data['pattern_ids'] ?? null)
                ? array_values(array_map(static fn ($v) => (string) $v, $data['pattern_ids']))
                : [];

            $payload = [
                'problem_id' => $problemId,
                'slug' => $slug,
                'status' => (string) ($data['status'] ?? 'draft'),
                'locale_flags' => $flags,
                'pattern_ids' => $patternIds,
                'title_ar' => isset($titles['ar']) ? (string) $titles['ar'] : null,
                'title_en' => isset($titles['en']) ? (string) $titles['en'] : null,
                'content_hash' => $hash,
                'git_sha' => $gitSha,
            ];
            if (! $dryRun) {
                ContentIndexProblem::query()->updateOrCreate(
                    ['problem_id' => $problemId],
                    $payload
                );
            }
            $problemCount++;
        }

        return ['patterns' => $patternCount, 'problems' => $problemCount];
    }

    /**
     * @return list<string>
     */
    protected function listPatternManifestPaths(): array
    {
        return $this->discoverFiles($this->paths->cpRoot().DIRECTORY_SEPARATOR.'patterns', 'pattern.json');
    }

    /**
     * @return list<string>
     */
    protected function discoverProblemJsonPaths(): array
    {
        $problems = $this->paths->cpRoot().DIRECTORY_SEPARATOR.'problems';
        if (! File::isDirectory($problems)) {
            return [];
        }
        $out = [];
        foreach (glob($problems.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR) ?: [] as $patternDir) {
            foreach (glob($patternDir.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR) ?: [] as $problemDir) {
                $j = $problemDir.DIRECTORY_SEPARATOR.'problem.json';
                if (File::isFile($j)) {
                    $out[] = $j;
                }
            }
        }

        return $out;
    }

    /**
     * @return list<string>
     */
    protected function discoverFiles(string $baseDir, string $filename): array
    {
        if (! File::isDirectory($baseDir)) {
            return [];
        }
        $out = [];
        foreach (File::allFiles($baseDir) as $file) {
            if ($file->getFilename() === $filename) {
                $out[] = $file->getPathname();
            }
        }

        return $out;
    }

    /**
     * @param  array<string, string>  $titles
     * @param  array<string, string>  $summaries
     * @param  list<string>  $tags
     */
    protected static function buildPatternSearchText(array $titles, array $summaries, array $tags): ?string
    {
        $parts = [
            ...array_values($titles),
            ...array_values($summaries),
            ...$tags,
        ];
        $joined = trim(implode(' ', array_filter($parts, static fn ($s) => is_string($s) && $s !== '')));

        return $joined === '' ? null : $joined;
    }
}
