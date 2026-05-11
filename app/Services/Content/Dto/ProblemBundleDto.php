<?php

namespace App\Services\Content\Dto;

readonly class ProblemBundleDto
{
    /**
     * @param  array<string, mixed>  $manifest  Decoded problem.json
     * @param  array<string, string>  $statements  Locale => markdown statement
     * @param  array<string, mixed>  $suite  Decoded primary tests/suite.json
     * @param  array<string, mixed>  $solutionBundle  Decoded solutions/metadata.json
     * @param  array<string, string>  $solutionSources  language => source text
     */
    public function __construct(
        public string $patternSlug,
        public string $problemSlug,
        public string $contentHash,
        public array $manifest,
        public array $statements,
        public string $explanationAr,
        public string $explanationEn,
        public array $suite,
        public array $solutionBundle,
        public array $solutionSources,
    ) {}
}
