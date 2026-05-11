<?php

namespace App\Services\Assistant\Prompts;

class ModePrompts
{
    public const MODES = [
        'topic_explanation' => 'Explain the likely topic or technique in an educational way. Focus on signals, when to use it, and when not to use it. Do not dump the full solution.',
        'topic_recommendation' => 'Recommend the most likely topics or tags for the visible problem. Briefly justify each recommendation from the visible evidence.',
        'hint' => 'Give only a directional hint. Do not reveal the full solution. Keep it concise and actionable.',
        'idea_check' => 'The user wants validation of their current idea. Confirm what is correct, point out what is missing, and stay concise.',
        'logic_critique' => 'Explain why the current logic is wrong or risky. Be direct, educational, and specific about the failure point.',
        'edge_cases' => 'Warn about edge cases, counterexamples, and boundary conditions that can break the current idea or implementation.',
        'complexity' => 'Analyze time and memory complexity, and mention the main trade-offs or bottlenecks.',
        'full_solution' => 'Provide the full solution only because it was explicitly requested. Include the main idea, complexity, and the final answer clearly.',
        'step_by_step_solution' => 'Explain the solution as a sequence of steps. Teach the path from observation to implementation, but keep the structure tight.',
        'approach_compare' => 'Compare two or more plausible approaches. Highlight why one is stronger under the visible constraints.',
        'common_mistakes' => 'List the common mistakes for this topic or visible problem and explain how to avoid them.',
        'solve' => 'Analyze the competitive programming problem provided. Output a structured response with: problem summary, constraints, input/output format, algorithm idea, time and memory complexity, and a complete correct solution in Python 3. Label each section clearly.',
        'generate_code' => 'Generate a complete, correct, and efficient Python 3 solution for the competitive programming problem provided. Output only the solution code with brief inline comments on non-obvious steps.',
        'generate_tests' => 'Generate a comprehensive test suite for the competitive programming problem. Include: sample cases from the problem, edge cases (empty input, max constraints, min constraints, boundary values), and stress-test cases. Output as a JSON array: [{"input": "...", "expected_output": "..."}].',
        'verify_code' => 'Review the provided solution code against the problem statement. Identify any bugs, incorrect assumptions, missing edge cases, or complexity issues. Be specific about what is wrong and why.',
        'debug_wrong_answer' => 'The provided solution produces a wrong answer. Identify the specific bug or logic error. Explain what the code does wrong, provide a counterexample, and suggest the fix.',
    ];

    public const LEGACY_ALIASES = [
        'check' => 'idea_check',
        'wrong' => 'logic_critique',
        'full' => 'full_solution',
        'summarize' => 'step_by_step_solution',
    ];

    public static function get(string $mode): string
    {
        $normalized = self::normalize($mode);

        return self::MODES[$normalized] ?? self::MODES['idea_check'];
    }

    public static function isValid(string $mode): bool
    {
        return isset(self::MODES[self::normalize($mode)]);
    }

    public static function normalize(string $mode): string
    {
        return self::LEGACY_ALIASES[$mode] ?? $mode;
    }

    public static function allowedRequestModes(): array
    {
        return array_values(array_unique([
            ...array_keys(self::MODES),
            ...array_keys(self::LEGACY_ALIASES),
        ]));
    }
}
