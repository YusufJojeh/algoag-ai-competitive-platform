<?php

namespace App\Modules\Execution\Contracts;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\DTO\VerificationRunResult;

/**
 * Evaluates generated tests against solution code.
 * Implementations may be stubs (no sandbox) or real isolated runners.
 */
interface CodeJudge
{
    public function judge(CodeforcesSolution $solution): VerificationRunResult;
}
