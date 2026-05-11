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
            'hint' => ['hint'],
            'check' => ['check'],
            'wrong' => ['wrong'],
            'full' => ['full'],
            'summarize' => ['summarize'],
            'edge_cases' => ['edge_cases'],
            'complexity' => ['complexity'],
        ];
    }

    public function test_user_prompt_prepends_mode_prefix(): void
    {
        $prompt = $this->orchestrator->buildUserPrompt('Binary Search', 'check');
        $this->assertStringContainsString('هل فكرتي صحيحة', $prompt);
        $this->assertStringContainsString('Binary Search', $prompt);
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
        foreach (array_keys(ModePrompts::MODES) as $mode) {
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
