<?php

namespace App\Services\Assistant;

use App\Services\Assistant\Prompts\ModePrompts;
use App\Services\Assistant\Prompts\SystemPrompt;

class PromptOrchestrator
{
    public function buildSystemPrompt(string $mode, string $responseLanguage = 'ar'): string
    {
        $normalizedMode = ModePrompts::normalize($mode);
        $modeInstruction = ModePrompts::get($normalizedMode);
        $languageInstruction = $this->languageInstruction($responseLanguage);

        return implode("\n\n", [
            SystemPrompt::BASE,
            "MODE: {$normalizedMode}",
            "MODE INSTRUCTION:\n{$modeInstruction}",
            "RESPONSE LANGUAGE:\n{$languageInstruction}",
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

        $wrappedTranscript = $transcript !== ''
            ? "<user_content>\n{$transcript}\n</user_content>"
            : '';

        if ($prefix && $wrappedTranscript) {
            return "{$prefix}\n{$wrappedTranscript}";
        }

        return $wrappedTranscript ?: $prefix;
    }

    private function languageInstruction(string $responseLanguage): string
    {
        return $responseLanguage === 'en'
            ? 'Reply in English because the current page UI language is English. Ignore the language of the pasted problem statement when choosing the response language. Keep code identifiers and technical terms unchanged.'
            : 'أجب بالعربية الفصحى لأن لغة واجهة الصفحة الحالية هي العربية. تجاهل لغة نص المسألة الملصق عند اختيار لغة الرد، وأبق أسماء المتغيرات والمصطلحات التقنية والكود كما هي عند الحاجة.';
    }
}
