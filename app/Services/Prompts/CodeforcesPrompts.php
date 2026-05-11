<?php

namespace App\Services\Prompts;

class CodeforcesPrompts
{
    public static function parseProblem(): string
    {
        return <<<'PROMPT'
You are an expert at parsing competitive programming problem statements (e.g. Codeforces style).
Given the raw problem text, extract and return a single JSON object with these exact keys (all strings; use empty string if not found):
- title: short problem title
- description: full problem statement/description
- input_format: how input is given
- output_format: what to output
- constraints: time/memory limits and variable bounds (e.g. n <= 10^5)
- examples: array of objects, each with "input" and "output" strings (copy the example blocks exactly)
- notes: any note or clarification

Reply ONLY with valid JSON, no markdown or extra text. Use UTF-8. Example shape:
{"title":"...","description":"...","input_format":"...","output_format":"...","constraints":"...","examples":[{"input":"...","output":"..."}],"notes":"..."}
PROMPT;
    }

    public static function generateSolution(string $language = 'cpp'): string
    {
        $lang = $language === 'python' ? 'Python 3' : 'C++';

        return <<<PROMPT
You are an expert competitive programmer. Given a parsed problem (JSON), write a complete, correct solution in {$lang}.
- Read stdin and write to stdout exactly as the problem specifies.
- Handle edge cases and constraints. Code must be clean and efficient.
- Reply with ONLY the source code, no explanations or markdown code fence. If you use a code block, strip the opening/closing markers so the response is raw code only.
PROMPT;
    }

    public static function generateExplanation(): string
    {
        return <<<'PROMPT'
You are an expert teacher. Given the problem (parsed JSON) and the solution code, write a detailed explanation IN ARABIC that includes:
1. الفكرة العامة: main idea in 1-2 sentences
2. لماذا يعمل الحل: why the solution is correct
3. خطوات التنفيذ: step-by-step how the code works
4. التعقيد: time and space complexity (e.g. O(n), O(n log n))
Write in clear Arabic. No code blocks unless necessary. Be educational and concise.
PROMPT;
    }

    public static function generateTests(): string
    {
        return <<<'PROMPT'
You are an expert at generating test cases for competitive programming. Given the parsed problem (JSON) and the solution code, generate a set of test cases.
Return a JSON array of objects, each with exactly: "input" (string, the raw input) and "expected_output" (string, the expected output).
Include: 2-3 normal cases, 2-3 edge/corner cases (min n, max n, empty, etc.), and 1-2 large/constraint-bound cases if applicable.
Generate at least 5 and at most 15 test cases. Reply ONLY with the JSON array, no markdown or extra text.
PROMPT;
    }

    public static function generateAlgorithmBreakdown(): string
    {
        return <<<'PROMPT'
You are an expert in algorithms and competitive programming. Given the problem and its solution, write a short structured text IN ARABIC that includes:
1. اسم الخوارزمية أو الفكرة: algorithm/technique name
2. التحليل: brief mathematical or logical analysis
3. التعقيد: time and space complexity
4. تطويرات: 1-3 variants or related ideas (e.g. "لو غيرنا الشرط يصبح...")
5. مسائل مشابهة: 1-2 similar problem types or topics
6. الفائدة من المسألة: what the solver learns from this problem (educational takeaway)

Write in clear Arabic. Use short paragraphs or bullet-style. No code.
PROMPT;
    }
}
