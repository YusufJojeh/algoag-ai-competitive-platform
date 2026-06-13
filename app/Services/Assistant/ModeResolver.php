<?php

namespace App\Services\Assistant;

/**
 * Resolves the 'auto' assistant mode into a concrete analysis mode by
 * matching verdict/intent keywords (Arabic and English) in the transcript.
 */
class ModeResolver
{
    public const AUTO_MODE = 'auto';

    public const DEFAULT_MODE = 'idea_check';

    /**
     * Ordered rules: the first match wins, so more specific intents come first.
     * Each rule is [mode, list of regex patterns matched case-insensitively].
     */
    private const RULES = [
        ['debug_wrong_answer', [
            '/\bwrong\s*answer\b/iu',
            '/\bwa\b/iu',
            '/إجابة\s*خاطئة/u',
            '/جواب\s*(خاطئ|غلط)/u',
            '/طلعت?\s*غلط/u',
            '/الناتج\s*(خاطئ|غلط)/u',
        ]],
        ['complexity', [
            '/\btime\s*limit\b/iu',
            '/\btle\b/iu',
            '/\btimeout\b/iu',
            '/\bmemory\s*limit\b/iu',
            '/\bmle\b/iu',
            '/تجاوز\s*(حد\s*)?الوقت/u',
            '/تعدى\s*الوقت/u',
            '/الحل\s*بطيء/u',
            '/بطيء\s*(جدا|كثير)?/u',
            '/الذاكرة/u',
            '/التعقيد/u',
            '/\bcomplexity\b/iu',
        ]],
        ['edge_cases', [
            '/\bedge\s*cases?\b/iu',
            '/\bcorner\s*cases?\b/iu',
            '/حال(ة|ات)\s*(ال)?حدية/u',
            '/حال(ة|ات)\s*(ال)?خاصة/u',
        ]],
        ['hint', [
            '/\bhint\b/iu',
            '/تلميح/u',
            '/لمح\s*لي/u',
            '/بدون\s*ما\s*تحل/u',
        ]],
        ['full_solution', [
            '/\bfull\s*solution\b/iu',
            '/\bsolve\s*it\b/iu',
            '/الحل\s*(الكامل|كامل)/u',
            '/حل\s*كامل/u',
            '/اعطني\s*الحل/u',
            '/أعطني\s*الحل/u',
        ]],
        ['step_by_step_solution', [
            '/\bstep\s*by\s*step\b/iu',
            '/خطوة\s*بخطوة/u',
            '/خطوة\s*خطوة/u',
        ]],
        ['topic_explanation', [
            '/\bexplain\s*(the\s*)?topic\b/iu',
            '/اشرح\s*(لي\s*)?(الموضوع|الفكرة|النمط)/u',
            '/شو\s*(الموضوع|الفكرة)/u',
            '/ما\s*هو\s*الموضوع/u',
        ]],
        ['logic_critique', [
            '/\bwhy\s*(is\s*)?(my\s*)?logic\s*wrong\b/iu',
            '/ليش\s*(منطقي|فكرتي)\s*(غلط|خطأ)/u',
            '/لماذا\s*منطقي\s*خاطئ/u',
        ]],
    ];

    public static function resolve(?string $transcript): string
    {
        $text = trim((string) $transcript);

        if ($text === '') {
            return self::DEFAULT_MODE;
        }

        foreach (self::RULES as [$mode, $patterns]) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $text) === 1) {
                    return $mode;
                }
            }
        }

        return self::DEFAULT_MODE;
    }
}
