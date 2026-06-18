<?php

namespace Tests\Unit;

use App\Services\Prompts\CodeforcesPrompts;
use Tests\TestCase;

class CodeforcesPromptsTest extends TestCase
{
    public function test_parse_problem_returns_non_empty_string(): void
    {
        $prompt = CodeforcesPrompts::parseProblem();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('JSON', $prompt);
        $this->assertStringContainsString('title', $prompt);
        $this->assertStringContainsString('examples', $prompt);
    }

    public function test_generate_solution_returns_python_by_default(): void
    {
        $prompt = CodeforcesPrompts::generateSolution();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('Python 3', $prompt);
        $this->assertStringContainsString('clear input parsing', $prompt);
    }

    public function test_generate_solution_returns_cpp17_when_requested(): void
    {
        $prompt = CodeforcesPrompts::generateSolution('cpp');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('C++17', $prompt);
        $this->assertStringContainsString('ios::sync_with_stdio(false);', $prompt);
        $this->assertStringContainsString('cin.tie(nullptr);', $prompt);
    }

    public function test_generate_solution_returns_python_when_requested(): void
    {
        $prompt = CodeforcesPrompts::generateSolution('python');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('Python 3', $prompt);
        $this->assertStringContainsString('sparse dictionaries/maps of reachable gcd states', $prompt);
    }

    public function test_localize_parsed_problem_requires_real_bilingual_translation(): void
    {
        $prompt = CodeforcesPrompts::localizeParsedProblem();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('Modern Standard Arabic', $prompt);
        $this->assertStringContainsString('Do NOT transliterate', $prompt);
        $this->assertStringContainsString('Copy every example input/output block exactly', $prompt);
        $this->assertStringContainsString('- ar:', $prompt);
        $this->assertStringContainsString('- en:', $prompt);
    }

    public function test_generate_explanation_returns_arabic_instructions(): void
    {
        $prompt = CodeforcesPrompts::generateExplanation();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('ARABIC', $prompt);
        $this->assertStringContainsString('الفكرة', $prompt);
    }

    public function test_generate_explanation_can_follow_english_page_language(): void
    {
        $prompt = CodeforcesPrompts::generateExplanation('en');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('IN ENGLISH', $prompt);
        $this->assertStringContainsString('current page UI language is English', $prompt);
        $this->assertStringContainsString('Ignore the language of the pasted problem statement', $prompt);
    }

    public function test_generate_explanation_mentions_selected_solution_language(): void
    {
        $cppPrompt = CodeforcesPrompts::generateExplanation('en', 'cpp');
        $pythonPrompt = CodeforcesPrompts::generateExplanation('en', 'python');

        $this->assertStringContainsString('C++17', $cppPrompt);
        $this->assertStringContainsString('Python 3', $pythonPrompt);
    }

    public function test_generate_tests_returns_non_empty_string(): void
    {
        $prompt = CodeforcesPrompts::generateTests();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('input', $prompt);
        $this->assertStringContainsString('expected_output', $prompt);
    }

    public function test_generate_algorithm_breakdown_returns_arabic_instructions(): void
    {
        $prompt = CodeforcesPrompts::generateAlgorithmBreakdown();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('الخوارزمية', $prompt);
        $this->assertStringContainsString('الفائدة', $prompt);
    }

    public function test_generate_algorithm_breakdown_can_follow_english_page_language(): void
    {
        $prompt = CodeforcesPrompts::generateAlgorithmBreakdown('en');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('IN ENGLISH', $prompt);
        $this->assertStringContainsString('current page UI language is English', $prompt);
        $this->assertStringContainsString('Ignore the language of the pasted problem statement', $prompt);
    }
}
