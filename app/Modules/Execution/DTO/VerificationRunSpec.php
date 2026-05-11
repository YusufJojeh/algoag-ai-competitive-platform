<?php

namespace App\Modules\Execution\DTO;

/**
 * Input contract for isolated verification runs (sandbox time/memory, target id).
 */
readonly class VerificationRunSpec
{
    public function __construct(
        public int $solutionId,
        public int $timeLimitMs = 5000,
        public int $memoryLimitMb = 256,
    ) {}
}
