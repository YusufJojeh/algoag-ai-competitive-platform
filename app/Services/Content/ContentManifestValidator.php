<?php

namespace App\Services\Content;

use Illuminate\Support\Facades\File;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

class ContentManifestValidator
{
    /** @var list<string> */
    protected array $errors = [];

    public function __construct(
        protected string $contentRoot,
        protected string $schemaRoot
    ) {}

    /**
     * @return list<string>
     */
    public function validateAll(): array
    {
        $this->errors = [];

        if (! File::isDirectory($this->contentRoot)) {
            $this->errors[] = 'Content root does not exist: '.$this->contentRoot;

            return $this->errors;
        }

        $problemIds = [];
        foreach ($this->discoverFiles($this->contentRoot.'/problems', 'problem.yaml') as $path) {
            $dir = dirname($path);
            $data = $this->parseYaml($path);
            if ($data === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($data, $this->schemaRoot, 'problem.schema.json', $path, $this->errors);
            if (isset($data['problem_id'])) {
                if (isset($problemIds[$data['problem_id']])) {
                    $this->errors[] = 'Duplicate problem_id '.$data['problem_id'].' in '.$path.' and '.$problemIds[$data['problem_id']];
                }
                $problemIds[$data['problem_id']] = $path;
            }
            $this->validateProblemPaths($data, $dir, $path);
        }

        foreach ($this->discoverFiles($this->contentRoot.'/patterns', 'pattern.yaml') as $path) {
            $data = $this->parseYaml($path);
            if ($data === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($data, $this->schemaRoot, 'pattern.schema.json', $path, $this->errors);
        }

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

    /**
     * @param  array<string, mixed>  $data
     */
    protected function validateProblemPaths(array $data, string $problemDir, string $manifestPath): void
    {
        $limits = $data['limits'] ?? null;
        foreach ($data['translation_paths'] ?? [] as $locale => $rel) {
            $full = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($full)) {
                $this->errors[] = "Missing translation file for [{$locale}]: {$full} (from {$manifestPath})";
            }
        }

        foreach ($data['supported_locales'] ?? [] as $locale) {
            if (empty($data['translation_paths'][$locale])) {
                $this->errors[] = "supported_locales includes {$locale} but translation_paths.{$locale} is missing ({$manifestPath})";
            }
        }

        foreach ($data['suite_refs'] ?? [] as $rel) {
            $suitePath = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($suitePath)) {
                $this->errors[] = "Missing suite file: {$suitePath} (from {$manifestPath})";

                continue;
            }
            $suite = $this->parseYaml($suitePath);
            if ($suite === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($suite, $this->schemaRoot, 'suite.schema.json', $suitePath, $this->errors);
            $suiteDir = dirname($suitePath);
            $this->validateSuiteSamples($suite, $suiteDir, $suitePath);
            $this->validateSuiteLimitsAgainstProblem($limits, $suite, $suitePath, $manifestPath);
        }

        foreach ($data['solution_refs'] ?? [] as $rel) {
            $solDir = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, dirname($rel));
            $solYaml = $problemDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
            if (! File::isFile($solYaml)) {
                $this->errors[] = "Missing solution manifest: {$solYaml} (from {$manifestPath})";

                continue;
            }
            $sol = $this->parseYaml($solYaml);
            if ($sol === null) {
                continue;
            }
            JsonSchemaAssertion::assertSchema($sol, $this->schemaRoot, 'solution.schema.json', $solYaml, $this->errors);
            $base = dirname($solYaml);
            foreach ($sol['files'] ?? [] as $file) {
                $p = $file['path'] ?? '';
                $full = $base.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $p);
                if (! File::isFile($full)) {
                    $this->errors[] = "Missing solution file: {$full} (from {$solYaml})";
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
            foreach (['input_path', 'output_path'] as $key) {
                $rel = $sample[$key] ?? '';
                $full = $suiteDir.DIRECTORY_SEPARATOR.str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
                if (! File::isFile($full)) {
                    $this->errors[] = "Missing sample file ({$key}): {$full} (from {$suitePath})";
                }
            }
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function parseYaml(string $path): ?array
    {
        try {
            $parsed = Yaml::parseFile($path);
        } catch (ParseException $e) {
            $this->errors[] = "YAML parse error in {$path}: ".$e->getMessage();

            return null;
        }
        if (! is_array($parsed)) {
            $this->errors[] = "Expected YAML mapping at {$path}";

            return null;
        }

        /** @var array<string, mixed> $parsed */
        return $parsed;
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
}
