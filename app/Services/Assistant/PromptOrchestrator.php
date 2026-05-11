<?php

namespace App\Services\Assistant;

use App\Services\Assistant\Prompts\ModePrompts;
use App\Services\Assistant\Prompts\SystemPrompt;

class PromptOrchestrator
{
    public function buildSystemPrompt(string $mode): string
    {
        $normalizedMode = ModePrompts::normalize($mode);
        $modeInstruction = ModePrompts::get($normalizedMode);

        return implode("\n\n", [
            SystemPrompt::BASE,
            "MODE: {$normalizedMode}",
            "MODE INSTRUCTION:\n{$modeInstruction}",
            SystemPrompt::ANTI_HALLUCINATION,
        ]);
    }

    public function buildUserPrompt(string $transcript, string $mode): string
    {
        $normalizedMode = ModePrompts::normalize($mode);

        $prefix = match ($normalizedMode) {
            'topic_explanation' => 'اشرح الموضوع أو النمط المرتبط بهذه المسألة:',
            'topic_recommendation' => 'ما الموضوعات أو الوسوم الأكثر احتمالاً لهذه المسألة؟',
            'hint' => 'أريد تلميحاً فقط:',
            'idea_check' => 'هل فكرتي صحيحة؟',
            'logic_critique' => 'اشرح لماذا منطقي أو فكرتي غير صحيحة:',
            'edge_cases' => 'ما الحالات الحدية؟',
            'complexity' => 'ما التعقيد الزمني والذاكري؟',
            'full_solution' => 'أعطني الحل الكامل:',
            'step_by_step_solution' => 'اشرح الحل خطوة بخطوة:',
            'approach_compare' => 'قارن بين المقاربات الممكنة لهذه المسألة:',
            'common_mistakes' => 'ما الأخطاء الشائعة هنا؟',
            default => '',
        };

        if ($prefix && $transcript) {
            return "{$prefix}\n{$transcript}";
        }

        return $transcript ?: $prefix;
    }
}
