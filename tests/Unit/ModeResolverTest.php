<?php

namespace Tests\Unit;

use App\Services\Assistant\ModeResolver;
use App\Services\Assistant\Prompts\ModePrompts;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ModeResolverTest extends TestCase
{
    #[DataProvider('transcriptProvider')]
    public function test_resolves_mode_from_transcript(string $transcript, string $expectedMode): void
    {
        $this->assertSame($expectedMode, ModeResolver::resolve($transcript));
    }

    public static function transcriptProvider(): array
    {
        return [
            // Wrong answer — English and Arabic
            'english wrong answer' => ['my solution gets wrong answer on test 3', 'debug_wrong_answer'],
            'english WA verdict' => ['I got WA on the second sample', 'debug_wrong_answer'],
            'arabic wrong answer' => ['الحل يعطيني إجابة خاطئة على التيست الثالث', 'debug_wrong_answer'],
            'arabic levantine wrong' => ['الجواب غلط ما بعرف ليش', 'debug_wrong_answer'],

            // Time/memory limit — English and Arabic
            'english TLE' => ['getting TLE on test 10', 'complexity'],
            'english time limit' => ['time limit exceeded on big inputs', 'complexity'],
            'arabic slow solution' => ['الحل بطيء كثير على المدخلات الكبيرة', 'complexity'],
            'arabic exceeded time' => ['تجاوز الوقت المسموح', 'complexity'],
            'english MLE' => ['I hit MLE with this array size', 'complexity'],

            // Hint
            'english hint' => ['just give me a hint please', 'hint'],
            'arabic hint' => ['أعطني تلميح بس بدون الحل', 'hint'],

            // Edge cases
            'english edge cases' => ['what edge cases am I missing?', 'edge_cases'],
            'arabic edge cases' => ['شو الحالات الحدية يلي ممكن تكسر الحل؟', 'edge_cases'],

            // Full solution
            'english full solution' => ['show me the full solution', 'full_solution'],
            'arabic full solution' => ['أعطني الحل الكامل', 'full_solution'],

            // Step by step
            'arabic step by step' => ['اشرح الحل خطوة بخطوة', 'step_by_step_solution'],

            // Topic explanation
            'arabic explain topic' => ['اشرح لي الموضوع تبع هاي المسألة', 'topic_explanation'],

            // Default: idea check
            'plain idea' => ['أعتقد أن الحل binary search على الجواب', 'idea_check'],
            'empty transcript' => ['', 'idea_check'],
            'whitespace transcript' => ['   ', 'idea_check'],
        ];
    }

    public function test_wa_token_does_not_match_inside_words(): void
    {
        $this->assertSame('idea_check', ModeResolver::resolve('I want to use two pointers'));
    }

    public function test_every_resolved_mode_is_a_valid_prompt_mode(): void
    {
        $resolvable = [
            'my solution gets wrong answer',
            'TLE on test 5',
            'edge cases?',
            'give me a hint',
            'show me the full solution',
            'step by step please',
            'explain the topic',
            'random idea text',
        ];

        foreach ($resolvable as $transcript) {
            $mode = ModeResolver::resolve($transcript);
            $this->assertTrue(ModePrompts::isValid($mode), "Resolved mode '{$mode}' must be a valid prompt mode.");
        }
    }

    public function test_auto_is_an_allowed_request_mode(): void
    {
        $this->assertContains('auto', ModePrompts::allowedRequestModes());
    }
}
