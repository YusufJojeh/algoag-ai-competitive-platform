<?php

namespace App\Modules\Execution\Judges;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use Illuminate\Support\Str;

/**
 * No code execution: records synthetic tests as "not_run" with educational metadata.
 * Safe default until a sandboxed runner exists.
 */
class StubCodeJudge implements CodeJudge
{
    public function judge(CodeforcesSolution $solution): VerificationRunResult
    {
        $tests = $solution->generated_tests ?? [];
        $cases = [];
        foreach ($tests as $i => $t) {
            $cases[] = [
                'index' => $i,
                'verdict' => 'not_run',
                'input_preview' => isset($t['input']) ? Str::limit((string) $t['input'], 120) : '',
                'note' => 'لم يُنفَّذ الكود في بيئة معزولة؛ النتائج توضيحية فقط.',
            ];
        }

        return new VerificationRunResult(
            engine: 'stub',
            executed: false,
            message: 'لا يوجد حكم تنفيذ حقيقي في هذا الإصدار؛ راجع الاختبارات المولَّدة يدوياً.',
            testCases: $cases,
            completedAt: now()->toIso8601String(),
        );
    }
}
