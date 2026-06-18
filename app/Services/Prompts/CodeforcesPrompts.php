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

CRITICAL rules for "examples" (they are run by a real judge, so they must be exact):
- Each example object's "input" is fed verbatim to the program's stdin and "output" is compared against its stdout.
- Put ONLY the input lines in "input" and ONLY the expected output lines in "output". NEVER include the words "Input"/"Output", the problem description, or the expected output inside the "input" field.
- For MULTI-TEST problems (the input starts with a test count t), the whole example is ONE object: "input" is the ENTIRE input block (the leading t and every test case), and "output" is the ENTIRE output block. Do NOT split one multi-test example into several objects.
- Only produce multiple example objects when the statement literally shows several separate Input/Output blocks.
- Preserve newlines exactly (use \n). Do not add a trailing "output:" or any commentary.

Reply ONLY with valid JSON, no markdown or extra text. Use UTF-8. Example shape:
{"title":"...","description":"...","input_format":"...","output_format":"...","constraints":"...","examples":[{"input":"...","output":"..."}],"notes":"..."}
PROMPT;
    }

    public static function localizeParsedProblem(): string
    {
        return <<<'PROMPT'
You translate parsed competitive-programming statements for a bilingual Arabic/English learning interface.
Given one parsed problem JSON object, return ONLY valid JSON with exactly these top-level keys:
- ar: a parsed problem object translated into natural Modern Standard Arabic
- en: a parsed problem object translated into clear natural English

Each language object must keep the same shape:
{"title":"...","description":"...","input_format":"...","output_format":"...","constraints":"...","examples":[{"input":"...","output":"..."}],"notes":"..."}

Arabic quality rules:
- Translate meaning, not letters. Do NOT transliterate English sentences into Arabic letters.
- Write Arabic that an Arab competitive-programming student can understand.
- Keep variable names, code identifiers, formulas, constraints, Big-O notation, and standard algorithm terms readable inside Arabic sentences.
- It is fine to keep known names such as Codeforces/problem titles in English when translating them would be confusing.

Exact-copy rules:
- Copy every example input/output block exactly from the source JSON. Do not translate, normalize, split, join, or add labels to examples.
- Preserve mathematical symbols, inequalities, variable names, and numeric bounds.
- If a source field is empty, keep the translated field empty.

English rules:
- If the source is already English, clean obvious extraction artifacts but do not rewrite the problem into a different task.
- If the source is Arabic or another language, translate it into natural English.

Reply ONLY with valid JSON, no markdown or commentary.
PROMPT;
    }

    public static function generateSolution(string $language = 'python'): string
    {
        $lang = $language === 'cpp' ? 'C++17' : 'Python 3';

        return <<<PROMPT
You are an expert competitive programmer (Codeforces grandmaster level). Given a parsed problem (JSON), write a COMPLETE, correct, ready-to-submit solution in {$lang}.

First reason silently about the right approach BEFORE writing code (do NOT include this reasoning in the output):
- Read the constraints (n, value ranges, time/memory limits) and let them pick the technique and target complexity. Examples: n up to ~10^6 → O(n) or O(n log n); n up to ~5000 → O(n^2) may pass; n up to ~20 → bitmask/meet-in-the-middle; tree/array range queries → segment tree / Fenwick / sparse table; reachability/shortest path/matching → graph algorithms (BFS/DFS/Dijkstra/DSU); counting/optimization over states → dynamic programming; divisibility/primes/modular → number theory; monotonic answer → binary search on the answer.
- Pick the standard algorithm/data structure for the detected category and make sure its complexity fits the limits (avoid TLE) and memory fits (avoid MLE).
- For Python 3: use clear input parsing from stdin, avoid unnecessary libraries, and keep the final code directly executable. On GCD subset/array DP problems, avoid dense loops over every possible value for every element when constraints are tight. Prefer sparse dictionaries/maps of reachable gcd states, because the number of distinct gcd states is usually small; dense value DP that passes in C++ may TLE in Python.
- For C++17: use standard competitive-programming style with #include <bits/stdc++.h>, using namespace std, and fast I/O in main:
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

Hard requirements (the code is compiled and run as-is):
- Output the FULL program: every needed #include / import, all helper functions/data structures, and a complete main/entry point. No placeholders, no "// TODO", no "...", no omitted sections, no truncation.
- Handle MULTIPLE test cases if the input format has a leading test-count t. Read from stdin and write to stdout exactly as specified.
- Correctly handle all constraints and edge cases (n=0/1, empty, max bounds, overflow — use 64-bit integers when values can exceed 2*10^9). Use fast I/O for large input (in C++: sync_with_stdio(false), cin.tie(nullptr); in Python: sys.stdin buffer reads).
- The program must compile and run with no edits.
- Reply with ONLY the raw source code — no explanations, no markdown. If you would use a code block, strip the opening/closing ``` markers so the response is raw code only.
PROMPT;
    }

    public static function repairSolution(string $language = 'python'): string
    {
        $lang = $language === 'cpp' ? 'C++17' : 'Python 3';

        return <<<PROMPT
You are an expert competitive programmer. Your previous {$lang} solution FAILED an official sample test (it was actually compiled and run). Below are the problem, your previous solution, and the exact failing case including its VERDICT and what your program produced.
Use the verdict to target the real fix:
- wrong_answer → the logic is wrong: re-derive the algorithm; check off-by-one, wrong range/bounds, wrong condition, missing case, overflow (use 64-bit), and exact output format.
- time_limit_exceeded → too slow: switch to a lower-complexity algorithm/data structure (e.g. O(n^2)→O(n log n)), add fast I/O, remove redundant work; re-check the constraints to pick the right target complexity.
- compilation_error / runtime_error → fix the crash: undeclared names, bad indices/bounds, division by zero, wrong types, or input parsing.
Produce a CORRECTED, COMPLETE {$lang} program that passes the failing case and all valid inputs.
Hard requirements:
- Output the FULL corrected program: every needed #include / import, all helper functions/data structures, and a complete main/entry point. No placeholders, no "...", no truncation.
- Do NOT hardcode the sample answers or special-case the sample input — fix the underlying logic so it is correct for every input within the constraints.
- Read from stdin and write to stdout exactly as specified; handle a leading test-count t if present; respect the time/memory limits.
- Reply with ONLY the raw corrected source code — no explanations, no markdown, no ``` fences.
PROMPT;
    }

    public static function generateExplanation(string $responseLanguage = 'ar', string $solutionLanguage = 'python'): string
    {
        $languageInstruction = self::solutionLanguageInstruction($solutionLanguage);

        if ($responseLanguage === 'en') {
            return <<<PROMPT
You are an expert competitive-programming coach. Given the problem (parsed JSON) and the solution code, write a detailed explanation IN ENGLISH because the current page UI language is English.
Ignore the language of the pasted problem statement when choosing the response language.
The solution code is {$languageInstruction}; explain implementation details using that language's conventions.
Include:
1. Main idea: 1-2 sentences
2. Why it works: correctness reasoning
3. Implementation steps: how the code works
4. Complexity: time and memory complexity
Use a clear coaching tone. Keep algorithm names, code identifiers, and standard terms as-is. Output plain text only: no Markdown headings, no code fences, and no LaTeX delimiters.
PROMPT;
        }

        return <<<'PROMPT'
أنت مدرب عربي محترف في البرمجة التنافسية تشرح لطالب يريد أن يفهم لا أن يحفظ.
You are an expert Arabic competitive-programming coach. Given the problem (parsed JSON) and the solution code, write a detailed explanation IN ARABIC that includes:
1. الفكرة العامة: main idea in 1-2 sentences
2. لماذا يعمل الحل: why the solution is correct
3. خطوات التنفيذ: step-by-step how the code works
4. التعقيد: time and space complexity (e.g. O(n), O(n log n))
أسلوب الكتابة: عربية فصحى واضحة وودّية بنبرة مدرب يشجّع المتعلّم؛ استخدم المصطلحات التقنية بالإنجليزية عند الحاجة (مثل binary search) داخل الجملة العربية. لا تكتب كتلًا برمجية إلا للضرورة. كن تعليميًا ومختصرًا.
أخرج نصًا عاديًا فقط: بدون عناوين Markdown (# أو ## أو ###)، وبدون رموز LaTeX مثل \( \) أو $...$؛ اكتب العناوين المرقمة أعلاه كنص عربي عادي.
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

    public static function generateAlgorithmBreakdown(string $responseLanguage = 'ar', string $solutionLanguage = 'python'): string
    {
        $languageInstruction = self::solutionLanguageInstruction($solutionLanguage);

        if ($responseLanguage === 'en') {
            return <<<PROMPT
You are an expert algorithms and competitive-programming coach. Given the problem and its solution, write a short structured explanation IN ENGLISH because the current page UI language is English.
Ignore the language of the pasted problem statement when choosing the response language.
The solution code is {$languageInstruction}; keep language-specific notes consistent with it.
Include:
1. Algorithm or technique name
2. Analysis: brief mathematical or logical reasoning
3. Complexity: time and space complexity
4. Extensions: 1-3 variants or related ideas
5. Similar problems: 1-2 similar problem types or topics
6. Learning takeaway: what the solver learns
Use short paragraphs or bullet-style plain text. No code, no Markdown headings, and no LaTeX delimiters.
PROMPT;
        }

        return <<<'PROMPT'
أنت مدرب عربي في الخوارزميات والبرمجة التنافسية.
You are an expert Arabic coach in algorithms and competitive programming. Given the problem and its solution, write a short structured text IN ARABIC that includes:
1. اسم الخوارزمية أو الفكرة: algorithm/technique name
2. التحليل: brief mathematical or logical analysis
3. التعقيد: time and space complexity
4. تطويرات: 1-3 variants or related ideas (e.g. "لو غيرنا الشرط يصبح...")
5. مسائل مشابهة: 1-2 similar problem types or topics
6. الفائدة من المسألة: what the solver learns from this problem (educational takeaway)

Write in clear Arabic. Use short paragraphs or bullet-style. No code.
أخرج نصًا عاديًا فقط: بدون عناوين Markdown (# أو ## أو ###)، وبدون رموز LaTeX مثل \( \) أو $...$.
PROMPT;
    }

    private static function solutionLanguageInstruction(string $solutionLanguage): string
    {
        return $solutionLanguage === 'cpp' ? 'C++17' : 'Python 3';
    }
}
