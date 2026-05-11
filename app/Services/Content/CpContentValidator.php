<?php

namespace App\Services\Content;

use App\Services\BenchmarkKeys;
use Illuminate\Support\Facades\File;

class CpContentValidator
{
    /** @var list<string> */
    protected array $errors = [];

    public function __construct(
        protected string $cpRoot,
        protected string $schemaRoot
    ) {}

    /**
     * @return list<string>
     */
    public function validateAll(): array
    {
        $this->errors = [];

        if (! File::isDirectory($this->cpRoot)) {
            $this->errors[] = 'CP content root does not exist: '.$this->cpRoot;

            return $this->sortErrors();
        }

        $patternIndex = $this->validatePatterns();

        $problemIds = [];
        foreach ($this->discoverProblemJsonPaths() as $path) {
            $dir = dirname($path);
            $data = $this->parseJson($path);
            if ($data === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($data, $this->schemaRoot, 'problem.schema.json', $path, $this->errors);
            $pid = $data['problem_id'] ?? null;
            if (is_string($pid)) {
                if (isset($problemIds[$pid])) {
                    $this->errors[] = 'Duplicate problem_id '.$pid.' in '.$path.' and '.$problemIds[$pid];
                } else {
                    $problemIds[$pid] = $path;
                }
            }
            $this->validateCpProblemPaths($data, $dir, $path, $patternIndex);
        }

        return $this->sortErrors();
    }

    /**
     * @return array<string, string> pattern_id => manifest path
     */
    protected function validatePatterns(): array
    {
        $patternIndex = [];
        $patternsDir = $this->cpRoot.DIRECTORY_SEPARATOR.'patterns';
        if (! File::isDirectory($patternsDir)) {
            return $patternIndex;
        }

        foreach ($this->discoverFiles($patternsDir, 'pattern.json') as $path) {
            $data = $this->parseJson($path);
            if ($data === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($data, $this->schemaRoot, 'pattern.schema.json', $path, $this->errors);
            $pid = $data['pattern_id'] ?? null;
            if (is_string($pid)) {
                $dirName = basename(dirname($path));
                if ($dirName !== $pid) {
                    $this->errors[] = "pattern directory must match pattern_id: expected directory \"{$pid}\", got \"{$dirName}\" ({$path})";
                }
                $patternIndex[$pid] = $path;
            }
            $this->validatePatternManifestCompleteness($data, $path);
        }

        return $patternIndex;
    }

    protected function validatePatternManifestCompleteness(array $data, string $path): void
    {
        if (($data['status'] ?? null) !== 'published') {
            return;
        }

        $this->requireBilingualObjectNonEmpty($data, 'title', $path);
        $this->requireBilingualObjectNonEmpty($data, 'summary', $path);
        $this->requireBilingualObjectNonEmpty($data, 'when_to_use', $path);
        $this->requireBilingualObjectNonEmpty($data, 'when_not_to_use', $path);
        $this->requireBilingualObjectNonEmpty($data, 'statement_signals', $path);

        if (empty($data['related_techniques'])) {
            $this->errors[] = "published pattern should have at least one related_techniques ({$path})";
        }

        if (empty($data['representative_problem_refs'])) {
            $this->errors[] = "published pattern must have at least one representative_problem_refs ({$path})";
        }

        $bk = $data['benchmark_key'] ?? null;
        if (is_string($bk) && $bk !== '' && ! BenchmarkKeys::isAllowed($bk)) {
            $this->errors[] = "Invalid benchmark_key \"{$bk}\" in {$path}";
        }

        if (isset($data['ollama_matching'])) {
            $om = $data['ollama_matching'];
            if (! is_array($om)) {
                $this->errors[] = "ollama_matching must be an object ({$path})";
            } else {
                if (empty($om['keywords'])) {
                    $this->errors[] = "ollama_matching should have keywords ({$path})";
                }
            }
        }

        $problemsRoot = $this->cpRoot.DIRECTORY_SEPARATOR.'problems';
        foreach ($data['representative_problem_refs'] ?? [] as $ref) {
            if (! is_array($ref)) {
                $this->errors[] = "representative_problem_refs must be an array of objects ({$path})";
                continue;
            }
            $ps = isset($ref['pattern_slug']) ? (string) $ref['pattern_slug'] : '';
            $qs = isset($ref['problem_slug']) ? (string) $ref['problem_slug'] : '';
            if ($ps === '' || $qs === '') {
                $this->errors[] = "representative_problem_refs: pattern_slug and problem_slug are required ({$path})";
                continue;
            }
            $probPath = $problemsRoot.DIRECTORY_SEPARATOR.$ps.DIRECTORY_SEPARATOR.$qs.DIRECTORY_SEPARATOR.'problem.json';
            if (! File::isFile($probPath)) {
                $this->errors[] = "representative_problem_refs: expected problem manifest at {$probPath} ({$path})";
            }
        }

        foreach ($data['related_pattern_ids'] ?? [] as $rpId) {
            if (! is_string($rpId)) {
                continue;
            }
            $rpPath = $this->cpRoot.DIRECTORY_SEPARATOR.'patterns'.DIRECTORY_SEPARATOR.$rpId.DIRECTORY_SEPARATOR.'pattern.json';
            if (! File::isFile($rpPath)) {
                $this->errors[] = "related_pattern_ids: unknown pattern_id \"{$rpId}\" ({$path})";
            }
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function requireBilingualObjectNonEmpty(array $data, string $key, string $path): void
    {
        $obj = $data[$key] ?? null;
        if (! is_array($obj)) {
            $this->errors[] = "published pattern requires non-empty {$key}.ar and {$key}.en ({$path})";

            return;
        }
        foreach (['ar', 'en'] as $loc) {
            $v = $obj[$loc] ?? null;
            if (! is_string($v) || trim($v) === '') {
                $this->errors[] = "published pattern requires non-empty {$key}.{$loc} ({$path})";
            }
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, string>  $patternIndex
     */
    protected function validateCpProblemPaths(array $data, string $problemDir, string $manifestPath, array $patternIndex): void
    {
        $patternSlug = basename(dirname($problemDir));
        $problemSlug = basename($problemDir);
        $ids = $data['pattern_ids'] ?? [];
        if (is_array($ids) && $ids !== [] && ($ids[0] ?? null) !== $patternSlug) {
            $this->errors[] = "Primary pattern folder \"{$patternSlug}\" must match pattern_ids[0] for {$manifestPath}";
        }
        if (($data['slug'] ?? $data['problem_id'] ?? null) !== $problemSlug) {
            $this->errors[] = "Problem directory \"{$problemSlug}\" must match slug or problem_id in {$manifestPath}";
        }

        foreach ($data['pattern_ids'] ?? [] as $refPid) {
            if (! is_string($refPid)) {
                continue;
            }
            if (! isset($patternIndex[$refPid])) {
                $this->errors[] = "Unknown pattern_id \"{$refPid}\" referenced by {$manifestPath} (no patterns/{$refPid}/pattern.json)";
            }
        }

        if (($data['cp_profile'] ?? null) === 'cp-v1') {
            foreach (['explanation.ar.md', 'explanation.en.md'] as $name) {
                $full = $problemDir.DIRECTORY_SEPARATOR.$name;
                if (! File::isFile($full)) {
                    $this->errors[] = "Missing CP explanation file: {$full} ({$manifestPath})";

                    continue;
                }
                $body = File::get($full);
                if (trim($body) === '') {
                    $this->errors[] = "Empty CP explanation file: {$full} ({$manifestPath})";
                }
                if (! mb_check_encoding($body, 'UTF-8')) {
                    $this->errors[] = "Explanation file is not valid UTF-8: {$full}";
                }
            }
        }

        $limits = $data['limits'] ?? null;
        foreach ($data['translation_paths'] ?? [] as $locale => $rel) {
            if (! is_string($locale) || ! is_string($rel)) {
                continue;
            }
            $full = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($full)) {
                $this->errors[] = "Missing translation file for [{$locale}]: {$full} (from {$manifestPath})";
            }
        }

        foreach ($data['supported_locales'] ?? [] as $locale) {
            if (empty($data['translation_paths'][$locale] ?? null)) {
                $this->errors[] = "supported_locales includes {$locale} but translation_paths.{$locale} is missing ({$manifestPath})";
            }
        }

        foreach ($data['suite_refs'] ?? [] as $rel) {
            if (! is_string($rel)) {
                continue;
            }
            $suitePath = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($suitePath)) {
                $this->errors[] = "Missing suite file: {$suitePath} (from {$manifestPath})";

                continue;
            }
            $suite = $this->parseJson($suitePath);
            if ($suite === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($suite, $this->schemaRoot, 'suite.schema.json', $suitePath, $this->errors);
            $suiteDir = dirname($suitePath);
            $this->validateSuiteSamples($suite, $suiteDir, $suitePath);
            $this->validateSuiteLimitsAgainstProblem($limits, $suite, $suitePath, $manifestPath);
        }

        foreach ($data['solution_refs'] ?? [] as $rel) {
            if (! is_string($rel)) {
                continue;
            }
            $metaPath = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($metaPath)) {
                $this->errors[] = "Missing solution bundle manifest: {$metaPath} (from {$manifestPath})";

                continue;
            }
            $bundle = $this->parseJson($metaPath);
            if ($bundle === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($bundle, $this->schemaRoot, 'solution-bundle.schema.json', $metaPath, $this->errors);
            $base = dirname($metaPath);
            foreach ($bundle['artifacts'] ?? [] as $artifact) {
                if (! is_array($artifact)) {
                    continue;
                }
                $p = $artifact['path'] ?? '';
                if (! is_string($p) || $p === '') {
                    continue;
                }
                $full = $base.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $p);
                if (! File::isFile($full)) {
                    $this->errors[] = "Missing solution artifact file: {$full} (from {$metaPath})";
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>|null  $limits
     * @param  array<string, mixed>  $suite
     */
    protected function validateSuiteLimitsAgainstProblem(?array $limits, array $suite, string $suitePath, string $manifestPath): void
    {
        if ($limits === null) {
            return;
        }
        $pt = $limits['time_limit_ms'] ?? null;
        $pm = $limits['memory_limit_mb'] ?? null;
        $st = $suite['time_limit_ms'] ?? null;
        $sm = $suite['memory_limit_mb'] ?? null;
        if ($st !== null && $pt !== null && $st > $pt) {
            $this->errors[] = "Suite time_limit_ms ({$st}) exceeds problem limit {$pt} — {$suitePath} vs {$manifestPath}";
        }
        if ($sm !== null && $pm !== null && $sm > $pm) {
            $this->errors[] = "Suite memory_limit_mb ({$sm}) exceeds problem limit {$pm} — {$suitePath} vs {$manifestPath}";
        }
    }

    /**
     * @param  array<string, mixed>  $suite
     */
    protected function validateSuiteSamples(array $suite, string $suiteDir, string $suitePath): void
    {
        foreach ($suite['samples'] ?? [] as $sample) {
            if (! is_array($sample)) {
                continue;
            }
            foreach (['input_path', 'output_path'] as $key) {
                $rel = $sample[$key] ?? '';
                if (! is_string($rel)) {
                    continue;
                }
                $full = $suiteDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
                if (! File::isFile($full)) {
                    $this->errors[] = "Missing sample file ({$key}): {$full} (from {$suitePath})";
                }
            }
        }
    }

    /**
     * @return list<string>
     */
    protected function discoverProblemJsonPaths(): array
    {
        $problems = $this->cpRoot.DIRECTORY_SEPARATOR.'problems';
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
     * @return array<string, mixed>|null
     */
    protected function parseJson(string $path): ?array
    {
        try {
            $raw = File::get($path);
            $parsed = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            $this->errors[] = 'JSON parse error in '.$path.': '.$e->getMessage();

            return null;
        }
        if (! is_array($parsed)) {
            $this->errors[] = 'Expected JSON object at '.$path;

            return null;
        }

        /** @var array<string, mixed> $parsed */
        return $parsed;
    }

    /**
     * @return list<string>
     */
    protected function sortErrors(): array
    {
        sort($this->errors);

        return $this->errors;
    }

    public function hasErrors(): bool
    {
        return $this->errors !== [];
    }

    /**
     * @return list<string>
     */
    public function errors(): array
    {
        return $this->errors;
    }
}
