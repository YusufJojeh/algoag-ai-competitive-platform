<?php

namespace App\Services\Content;

use App\Services\Content\Dto\ProblemBundleDto;
use App\Services\Content\Exceptions\ContentCorruptException;
use App\Services\Content\Exceptions\ContentNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class ProblemRepository
{
    public function __construct(
        protected CpContentPaths $paths,
        protected ContentFileReader $reader,
        protected CpContentHasher $hasher
    ) {}

    public function getProblem(string $patternSlug, string $problemSlug): ProblemBundleDto
    {
        $dir = $this->paths->problemDirectory($patternSlug, $problemSlug);
        if (! File::isDirectory($dir)) {
            throw new ContentNotFoundException('Problem not found: '.$patternSlug.'/'.$problemSlug);
        }

        $manifestPath = $this->paths->problemManifestPath($patternSlug, $problemSlug);
        if (! File::isFile($manifestPath)) {
            throw new ContentNotFoundException('Problem manifest missing: '.$manifestPath);
        }

        $hash = $this->hasher->hashProblemDirectory($dir);
        $key = 'cp:problem:'.$patternSlug.':'.$problemSlug.':v'.$hash;
        $ttl = config('content.cache_ttl');

        $loader = function () use ($patternSlug, $problemSlug, $dir, $hash): ProblemBundleDto {
            return $this->loadProblemBundle($patternSlug, $problemSlug, $dir, $hash);
        };

        if ($ttl === null || $ttl === '') {
            return Cache::rememberForever($key, $loader);
        }

        return Cache::remember($key, (int) $ttl, $loader);
    }

    public function computeContentHash(string $patternSlug, string $problemSlug): string
    {
        $dir = $this->paths->problemDirectory($patternSlug, $problemSlug);

        return $this->hasher->hashProblemDirectory($dir);
    }

    protected function loadProblemBundle(
        string $patternSlug,
        string $problemSlug,
        string $dir,
        string $hash
    ): ProblemBundleDto {
        $manifest = $this->reader->readJson($dir.DIRECTORY_SEPARATOR.'problem.json');

        $statements = [];
        foreach ($manifest['translation_paths'] ?? [] as $locale => $rel) {
            if (! is_string($locale) || ! is_string($rel)) {
                continue;
            }
            $p = $dir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            $statements[$locale] = $this->reader->readUtf8($p);
        }

        $explanationAr = '';
        $explanationEn = '';
        if (($manifest['cp_profile'] ?? null) === 'cp-v1') {
            $explanationAr = $this->reader->readUtf8($dir.DIRECTORY_SEPARATOR.'explanation.ar.md');
            $explanationEn = $this->reader->readUtf8($dir.DIRECTORY_SEPARATOR.'explanation.en.md');
        }

        $suiteRefs = $manifest['suite_refs'] ?? [];
        $suitePath = $suiteRefs[0] ?? null;
        if (! is_string($suitePath) || $suitePath === '') {
            throw new ContentCorruptException('problem.json must declare suite_refs[0] for '.$dir);
        }
        $suiteFull = $dir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $suitePath);
        $suite = $this->reader->readJson($suiteFull);

        $solutionRefs = $manifest['solution_refs'] ?? [];
        $solRef = $solutionRefs[0] ?? null;
        if (! is_string($solRef) || $solRef === '') {
            throw new ContentCorruptException('problem.json must declare solution_refs[0] for '.$dir);
        }
        $metaFull = $dir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $solRef);
        $solutionBundle = $this->reader->readJson($metaFull);
        $solutionDir = dirname($metaFull);

        $solutionSources = [];
        foreach ($solutionBundle['artifacts'] ?? [] as $artifact) {
            if (! is_array($artifact)) {
                continue;
            }
            $lang = $artifact['language'] ?? null;
            $rel = $artifact['path'] ?? null;
            if (! is_string($lang) || ! is_string($rel)) {
                continue;
            }
            $srcPath = $solutionDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            $solutionSources[$lang] = $this->reader->readUtf8($srcPath);
        }

        return new ProblemBundleDto(
            patternSlug: $patternSlug,
            problemSlug: $problemSlug,
            contentHash: $hash,
            manifest: $manifest,
            statements: $statements,
            explanationAr: $explanationAr,
            explanationEn: $explanationEn,
            suite: $suite,
            solutionBundle: $solutionBundle,
            solutionSources: $solutionSources,
        );
    }
}
