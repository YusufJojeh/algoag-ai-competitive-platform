<?php

namespace Tests\Unit;

use App\Services\Assistant\Prompts\ModePrompts;
use App\Services\Assistant\Prompts\SystemPrompt;
use App\Services\Assistant\PromptOrchestrator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PromptOrchestratorTest extends TestCase
{
    private PromptOrchestrator $orchestrator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orchestrator = new PromptOrchestrator;
    }

    public function test_system_prompt_contains_base_and_anti_hallucination(): void
    {
        $prompt = $this->orchestrator->buildSystemPrompt('check');

        $this->assertStringContainsString('senior problem-solving coach', $prompt);
        $this->assertStringContainsString('Maximum 3 short sentences', $prompt);
        $this->assertStringContainsString('لا أستطيع قراءة الشاشة بوضوح', $prompt);
        $this->assertStringContainsString('لست متأكداً تماماً', $prompt);
    }

    #[DataProvider('modeProvider')]
    public function test_system_prompt_includes_mode_instruction(string $mode): void
    {
        $prompt = $this->orchestrator->buildSystemPrompt($mode);
        $modeText = ModePrompts::get($mode);

        $this->assertStringContainsString($modeText, $prompt);
    }

    public static function modeProvider(): array
    {
        return [
            'topic_explanation' => ['topic_explanation'],
            'topic_recommendation' => ['topic_recommendation'],
            'hint' => ['hint'],
            'idea_check' => ['idea_check'],
            'check' => ['check'],
            'logic_critique' => ['logic_critique'],
            'wrong' => ['wrong'],
            'debug_wrong_answer' => ['debug_wrong_answer'],
            'full' => ['full'],
            'full_solution' => ['full_solution'],
            'summarize' => ['summarize'],
            'next_step' => ['next_step'],
            'step_by_step_solution' => ['step_by_step_solution'],
            'approach_compare' => ['approach_compare'],
            'common_mistakes' => ['common_mistakes'],
            'solve' => ['solve'],
            'generate_code' => ['generate_code'],
            'generate_tests' => ['generate_tests'],
            'verify_code' => ['verify_code'],
            'edge_cases' => ['edge_cases'],
            'complexity' => ['complexity'],
        ];
    }

    public function test_user_prompt_prepends_mode_prefix(): void
    {
        $prompt = $this->orchestrator->buildUserPrompt('Binary Search', 'check');
        $this->assertStringContainsString('هل فكرتي صحيحة', $prompt);
        $this->assertStringContainsString('Binary Search', $prompt);
        $this->assertStringContainsString('<user_content>', $prompt);
        $this->assertStringContainsString('</user_content>', $prompt);
    }

    public function test_system_prompt_forces_current_page_language(): void
    {
        $englishPrompt = $this->orchestrator->buildSystemPrompt('hint', 'en');
        $arabicPrompt = $this->orchestrator->buildSystemPrompt('hint', 'ar');

        $this->assertStringContainsString('Reply in English because the current page UI language is English', $englishPrompt);
        $this->assertStringContainsString('Ignore the language of the pasted problem statement', $englishPrompt);
        $this->assertStringContainsString('أجب بالعربية الفصحى لأن لغة واجهة الصفحة الحالية هي العربية', $arabicPrompt);
    }

    public function test_user_prompt_hint_mode(): void
    {
        $prompt = $this->orchestrator->buildUserPrompt('my idea', 'hint');
        $this->assertStringContainsString('تلميح', $prompt);
    }

    public function test_user_prompt_with_empty_transcript(): void
    {
        $prompt = $this->orchestrator->buildUserPrompt('', 'complexity');
        $this->assertNotEmpty($prompt);
    }

    public function test_all_modes_are_valid(): void
    {
        foreach ([...array_keys(ModePrompts::MODES), ...array_keys(ModePrompts::LEGACY_ALIASES)] as $mode) {
            $this->assertTrue(ModePrompts::isValid($mode));
        }
    }

    public function test_invalid_mode_returns_false(): void
    {
        $this->assertFalse(ModePrompts::isValid('nonexistent'));
    }

    public function test_system_prompt_base_is_not_empty(): void
    {
        $this->assertNotEmpty(SystemPrompt::BASE);
    }

    public function test_anti_hallucination_rules_not_empty(): void
    {
        $this->assertNotEmpty(SystemPrompt::ANTI_HALLUCINATION);
    }
}
