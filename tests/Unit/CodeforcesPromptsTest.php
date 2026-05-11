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

    public function test_generate_solution_returns_cpp_by_default(): void
    {
        $prompt = CodeforcesPrompts::generateSolution('cpp');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('C++', $prompt);
    }

    public function test_generate_solution_returns_python_when_requested(): void
    {
        $prompt = CodeforcesPrompts::generateSolution('python');
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('Python', $prompt);
    }

    public function test_generate_explanation_returns_arabic_instructions(): void
    {
        $prompt = CodeforcesPrompts::generateExplanation();
        $this->assertNotEmpty($prompt);
        $this->assertStringContainsString('ARABIC', $prompt);
        $this->assertStringContainsString('الفكرة', $prompt);
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
}
