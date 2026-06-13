<?php

namespace App\Modules\Execution\Contracts;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\DTO\VerificationRunResult;

/**
 * Evaluates tests against solution code.
 * Implementations may be stubs (no sandbox) or real isolated runners.
 */
interface CodeJudge
{
    /**
     * Judge an AI Codeforces solution (reads code/language/tests off the model).
     */
    public function judge(CodeforcesSolution $solution): VerificationRunResult;

    /**
     * Language-agnostic entry point: run arbitrary source code against a set of
     * tests and return a normalized result. Used by the Arena submission judge.
     *
     * @param  array<int, array{input?: string, expected_output?: string, output?: string}>  $tests
     * @param  array{time_limit_seconds?: int}  $limits  Optional per-problem overrides.
     */
    public function run(string $code, string $language, array $tests, array $limits = []): VerificationRunResult;
}
