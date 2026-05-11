<?php

namespace App\Services\Content\Dto;

readonly class PatternDto
{
    /**
     * @param  array<string, string>  $title
     * @param  array<string, string>  $summary
     * @param  array<string, string>  $whenToUse
     * @param  array<string, string>  $whenNotToUse
     * @param  array<string, string>  $statementSignals
     * @param  list<string>  $relatedTechniques
     * @param  list<string>  $relatedPatternIds
     * @param  list<array{pattern_slug: string, problem_slug: string}>  $representativeProblemRefs
     * @param  list<string>  $analyticsTags
     * @param  array{keywords: list<string>, negative_keywords: list<string>, notes: array<string, string>}|null  $ollamaMatching
     */
    public function __construct(
        public int $schemaVersion,
        public string $patternId,
        public string $status,
        public array $title,
        public array $summary,
        public array $whenToUse,
        public array $whenNotToUse,
        public array $statementSignals,
        public array $relatedTechniques,
        public array $relatedPatternIds,
        public array $representativeProblemRefs,
        public ?string $benchmarkKey,
        public ?array $ollamaMatching,
        public array $analyticsTags,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'schema_version' => $this->schemaVersion,
            'pattern_id' => $this->patternId,
            'status' => $this->status,
            'title' => $this->title,
            'summary' => $this->summary,
            'when_to_use' => $this->whenToUse,
            'when_not_to_use' => $this->whenNotToUse,
            'statement_signals' => $this->statementSignals,
            'related_techniques' => $this->relatedTechniques,
            'related_pattern_ids' => $this->relatedPatternIds,
            'representative_problem_refs' => $this->representativeProblemRefs,
            'benchmark_key' => $this->benchmarkKey,
            'ollama_matching' => $this->ollamaMatching,
            'analytics_tags' => $this->analyticsTags,
        ];
    }
}
