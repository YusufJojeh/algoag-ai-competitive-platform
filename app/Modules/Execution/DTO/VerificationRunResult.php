<?php

namespace App\Modules\Execution\DTO;

use App\Models\CodeforcesSolution;

/**
 * Normalized judge output stored on {@see CodeforcesSolution::$run_results}.
 */
readonly class VerificationRunResult
{
    /**
     * @param  array<int, array<string, mixed>>  $testCases
     */
    public function __construct(
        public string $engine,
        public bool $executed,
        public string $message,
        public array $testCases,
        public string $completedAt,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'engine' => $this->engine,
            'executed' => $this->executed,
            'message' => $this->message,
            'test_cases' => $this->testCases,
            'completed_at' => $this->completedAt,
        ];
    }
}
