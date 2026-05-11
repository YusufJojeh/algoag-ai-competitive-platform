<?php

namespace App\Services\Content;

class CpContentPaths
{
    public function __construct(
        protected string $cpRoot
    ) {}

    public function cpRoot(): string
    {
        return $this->cpRoot;
    }

    public function patternManifestPath(string $patternSlug): string
    {
        return $this->join($this->cpRoot, 'patterns', $patternSlug, 'pattern.json');
    }

    public function problemDirectory(string $patternSlug, string $problemSlug): string
    {
        return $this->join($this->cpRoot, 'problems', $patternSlug, $problemSlug);
    }

    public function problemManifestPath(string $patternSlug, string $problemSlug): string
    {
        return $this->join($this->problemDirectory($patternSlug, $problemSlug), 'problem.json');
    }

    /**
     * @param  non-empty-string  $segments
     */
    protected function join(string ...$segments): string
    {
        $path = array_shift($segments);
        foreach ($segments as $s) {
            $path .= DIRECTORY_SEPARATOR.$s;
        }

        return $path;
    }
}
