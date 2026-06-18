<?php

namespace App\Services;

use App\Models\CodeforcesSolution;
use App\Models\VerificationRun;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Realtime\Events\CodeforcesSolutionStatusUpdated;
use App\Services\AI\AiUsageService;
use App\Services\AI\PrimaryTextGenerator;
use App\Services\AI\TextGenerator;
use App\Services\Prompts\CodeforcesPrompts;
use Illuminate\Support\Facades\Log;

class CodeforcesSolverService
{
    /** Timeout per AI call in seconds (pipeline has multiple calls). */
    protected int $timeout = 180;

    public function __construct(
        protected TextGenerator $ai,
        protected CodeJudge $judge,
        protected string $solutionModel = CodeforcesSolution::class,
        protected ?AiUsageService $usage = null,
    ) {}

    /**
     * Provider label for telemetry — reflects the provider that actually served
     * the request (openai when configured, otherwise ollama).
     */
    protected function providerName(): string
    {
        return $this->ai instanceof PrimaryTextGenerator
            ? $this->ai->activeProvider()
            : (string) config('services.ai.primary', 'ollama');
    }

    /**
     * Model label for telemetry, matching {@see providerName()}.
     */
    protected function providerModel(): string
    {
        return $this->providerName() === 'openai'
            ? (string) config('services.ai.openai.model', 'gpt-4o')
            : (string) config('services.ollama.model');
    }

    /**
     * Create a solution row and run the full pipeline synchronously (used by tests and tooling).
     * HTTP requests use {@see ProcessCodeforcesSolutionJob} + {@see runPipeline} instead.
     */
    public function solve(string $problem, string $language, ?int $userId = null): CodeforcesSolution
    {
        $language = $language === 'python' ? 'python' : 'cpp';

        /** @var class-string<CodeforcesSolution> $modelClass */
        $modelClass = $this->solutionModel;
        $solution = $modelClass::query()->create([
            'user_id' => $userId,
            'problem_text' => $problem,
            'solution_language' => $language,
            'response_language' => 'ar',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $this->runPipeline($solution->id);

        return $modelClass::query()->findOrFail($solution->id);
    }

    /**
     * Run the full pipeline on an existing row: parse -> code -> explain -> tests -> judge -> algorithm breakdown.
     */
    public function runPipeline(int $solutionId): void
    {
        $solution = ($this->solutionModel)::query()->findOrFail($solutionId);
        $start = microtime(true);

        try {
            $solution->status = CodeforcesSolution::STATUS_PROCESSING;
            $solution->progress_stage = CodeforcesSolution::STAGE_PARSING;
            $solution->save();

            $problemText = $solution->problem_text;
            $language = $solution->solution_language === 'cpp' ? 'cpp' : 'python';
            $responseLanguage = $solution->response_language === 'en' ? 'en' : 'ar';

            $parsedProblem = $this->parseProblem($problemText);
            $solution->parsed_problem = $parsedProblem;
            $parsedTranslations = $this->localizeParsedProblem($parsedProblem);
            $solution->parsed_problem_translations = $parsedTranslations;
            $solution->problem_text_translations = [
                'ar' => $this->problemTextFromParsed($parsedTranslations['ar'] ?? $parsedProblem),
                'en' => $this->problemTextFromParsed($parsedTranslations['en'] ?? $parsedProblem),
            ];
            $solution->save();

            $solution->progress_stage = CodeforcesSolution::STAGE_GENERATING_CODE;
            $solution->save();

            $parsedJson = is_array($solution->parsed_problem)
                ? json_encode($solution->parsed_problem, JSON_UNESCAPED_UNICODE)
                : (string) $solution->parsed_problem;

            $solution->solution_code = $this->generateSolution($parsedJson, $language);
            $solution->solution_language = $language === 'python' ? 'python' : 'cpp';
            $solution->save();

            // "full code true": never complete with no solution. An empty body
            // means the model returned nothing usable — fail loudly instead of
            // presenting a blank "solved" result.
            if (trim((string) $solution->solution_code) === '') {
                throw new \RuntimeException('Empty solution code generated.');
            }

            // Self-correct against the official samples: if the judge can actually
            // run this language and the sample verdict is wrong, re-prompt the model
            // with the failing case and retry. Turns "full code" into "correct code".
            $solution->solution_code = $this->verifyAndRepairSolution($solution, $parsedJson, $language);
            $solution->save();

            $solution->progress_stage = CodeforcesSolution::STAGE_GENERATING_EXPLANATION;
            $solution->save();

            $explanations = $this->generateTextTranslations(
                fn (string $locale) => $this->generateExplanation($parsedJson, $solution->solution_code, $locale, $language)
            );
            $solution->explanation_translations = $explanations;
            $solution->explanation = $explanations[$responseLanguage] ?? $explanations['ar'] ?? $explanations['en'] ?? '';
            $solution->save();

            $solution->progress_stage = CodeforcesSolution::STAGE_GENERATING_TESTS;
            $solution->save();

            // Official sample cases (authoritative ground truth) plus AI-generated
            // edge/stress cases (illustrative — their expected outputs are model
            // guesses and can be wrong).
            $sampleTests = $this->extractSampleTests($solution);
            $displayTests = $this->mergeTests(
                $sampleTests,
                $this->generateTests($parsedJson, $solution->solution_code),
            );

            // Judge for the verdict against the OFFICIAL samples when we have them,
            // so a flaky AI-invented expected output can't produce a false
            // wrong_answer. Fall back to the full set when there are no samples.
            $judgedTests = ! empty($sampleTests) ? $sampleTests : $displayTests;
            $solution->generated_tests = $judgedTests;
            $solution->save();

            $solution->progress_stage = CodeforcesSolution::STAGE_JUDGING;
            $solution->save();

            $judgeResult = $this->judge->judge($solution);
            $solution->run_results = $judgeResult->toArray();
            $solution->save();

            // Persist structured verification run for academic reporting
            $this->persistVerificationRun($solution, $judgeResult->toArray());

            if ($this->hasFailedVerification($judgeResult->toArray())) {
                Log::warning('codeforces.solver.verification_failed', [
                    'solution_id' => $solution->id,
                    'provider' => $this->providerName(),
                    'failure_category' => 'verification_failed',
                ]);

                $solution->status = CodeforcesSolution::STATUS_FAILED;
                $solution->progress_stage = CodeforcesSolution::STAGE_FAILED;
                $solution->error_message = 'تعذر إكمال العملية. حاول مرة أخرى.';
                $this->usage()->record(
                    $solution->user_id,
                    AiUsageService::FEATURE_CODEFORCES_SOLVE,
                    'failed',
                    $this->providerName(),
                    $this->providerModel(),
                    (int) ((microtime(true) - $start) * 1000),
                    null,
                    'verification_failed',
                );
                $solution->save();

                return;
            }

            // Keep the samples + illustrative AI cases for the tests tab.
            $solution->generated_tests = $displayTests;
            $solution->save();

            $solution->progress_stage = CodeforcesSolution::STAGE_GENERATING_BREAKDOWN;
            $solution->save();

            $algorithmBreakdowns = $this->generateTextTranslations(
                fn (string $locale) => $this->generateAlgorithmBreakdown($parsedJson, $solution->solution_code, $locale, $language)
            );
            $solution->algorithm_breakdown_translations = $algorithmBreakdowns;
            $solution->algorithm_breakdown = $algorithmBreakdowns[$responseLanguage] ?? $algorithmBreakdowns['ar'] ?? $algorithmBreakdowns['en'] ?? '';
            $solution->status = CodeforcesSolution::STATUS_COMPLETED;
            $solution->progress_stage = CodeforcesSolution::STAGE_COMPLETED;
            $solution->error_message = null;
            $this->usage()->record(
                $solution->user_id,
                AiUsageService::FEATURE_CODEFORCES_SOLVE,
                'completed',
                $this->providerName(),
                $this->providerModel(),
                (int) ((microtime(true) - $start) * 1000),
            );
        } catch (\Throwable $e) {
            Log::error('codeforces.solver.failed', [
                'solution_id' => $solution->id,
                'provider' => $this->providerName(),
                'failure_category' => 'provider_failure',
            ]);
            $solution->status = CodeforcesSolution::STATUS_FAILED;
            $solution->progress_stage = CodeforcesSolution::STAGE_FAILED;
            $solution->error_message = 'تعذر إكمال العملية. حاول مرة أخرى.';
            $this->usage()->record(
                $solution->user_id,
                AiUsageService::FEATURE_CODEFORCES_SOLVE,
                'failed',
                $this->providerName(),
                $this->providerModel(),
                (int) ((microtime(true) - $start) * 1000),
                null,
                'provider_failure',
            );
        }

        $solution->save();

        $solution->refresh();
        if ($solution->user_id !== null && in_array($solution->status, [CodeforcesSolution::STATUS_COMPLETED, CodeforcesSolution::STATUS_FAILED], true)) {
            broadcast(new CodeforcesSolutionStatusUpdated(
                $solution->id,
                (int) $solution->user_id,
                $solution->status,
                $solution->error_message
            ));
        }
    }

    protected function parseProblem(string $problemText): array
    {
        $system = CodeforcesPrompts::parseProblem();
        $prompt = $system."\n\n<user_content>\n".$problemText."\n</user_content>";
        $response = $this->ai->generate($prompt, $this->timeout);
        $response = $this->stripJsonFromResponse($response);
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return [
                'title' => '',
                'description' => $problemText,
                'input_format' => '',
                'output_format' => '',
                'constraints' => '',
                'examples' => [],
                'notes' => '',
            ];
        }

        return $decoded;
    }

    protected function localizeParsedProblem(array $parsedProblem): array
    {
        $fallback = $this->normalizeParsedProblem($parsedProblem);
        $system = CodeforcesPrompts::localizeParsedProblem();
        $prompt = $system."\n\n<parsed_problem>\n"
            .json_encode($fallback, JSON_UNESCAPED_UNICODE)
            ."\n</parsed_problem>";
        $response = $this->stripJsonFromResponse($this->ai->generate($prompt, $this->timeout));
        $decoded = json_decode($response, true);

        if (! is_array($decoded)) {
            return [
                'ar' => $fallback,
                'en' => $fallback,
            ];
        }

        return [
            'ar' => $this->normalizeParsedProblem(is_array($decoded['ar'] ?? null) ? $decoded['ar'] : [], $fallback),
            'en' => $this->normalizeParsedProblem(is_array($decoded['en'] ?? null) ? $decoded['en'] : [], $fallback),
        ];
    }

    protected function normalizeParsedProblem(array $candidate, ?array $fallback = null): array
    {
        $fallback ??= [
            'title' => '',
            'description' => '',
            'input_format' => '',
            'output_format' => '',
            'constraints' => '',
            'examples' => [],
            'notes' => '',
        ];

        $fallbackExamples = is_array($fallback['examples'] ?? null) ? $fallback['examples'] : [];
        $examples = ! empty($fallbackExamples)
            ? $fallbackExamples
            : ($candidate['examples'] ?? []);
        if (! is_array($examples)) {
            $examples = [];
        }

        return [
            'title' => (string) ($candidate['title'] ?? $fallback['title'] ?? ''),
            'description' => (string) ($candidate['description'] ?? $fallback['description'] ?? ''),
            'input_format' => (string) ($candidate['input_format'] ?? $fallback['input_format'] ?? ''),
            'output_format' => (string) ($candidate['output_format'] ?? $fallback['output_format'] ?? ''),
            'constraints' => (string) ($candidate['constraints'] ?? $fallback['constraints'] ?? ''),
            'examples' => $this->normalizeExamples($examples, $fallbackExamples),
            'notes' => (string) ($candidate['notes'] ?? $fallback['notes'] ?? ''),
        ];
    }

    protected function normalizeExamples(array $examples, array $fallbackExamples = []): array
    {
        $normalized = [];
        foreach ($examples as $example) {
            if (! is_array($example) || ! array_key_exists('input', $example)) {
                continue;
            }
            $normalized[] = [
                'input' => (string) $example['input'],
                'output' => (string) ($example['output'] ?? $example['expected_output'] ?? ''),
            ];
        }

        if (! empty($normalized)) {
            return $normalized;
        }

        $fallback = [];
        foreach ($fallbackExamples as $example) {
            if (! is_array($example) || ! array_key_exists('input', $example)) {
                continue;
            }
            $fallback[] = [
                'input' => (string) $example['input'],
                'output' => (string) ($example['output'] ?? $example['expected_output'] ?? ''),
            ];
        }

        return $fallback;
    }

    protected function problemTextFromParsed(array $parsedProblem): string
    {
        $parts = [];
        foreach (['title', 'description', 'input_format', 'output_format', 'constraints', 'notes'] as $key) {
            $value = trim((string) ($parsedProblem[$key] ?? ''));
            if ($value !== '') {
                $parts[] = $value;
            }
        }

        return trim(implode("\n\n", $parts));
    }

    protected function generateTextTranslations(callable $generator): array
    {
        return [
            'ar' => trim((string) $generator('ar')),
            'en' => trim((string) $generator('en')),
        ];
    }

    protected function generateSolution(string $parsedJson, string $language): string
    {
        $system = CodeforcesPrompts::generateSolution($language);
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>";
        $response = $this->ai->generate($prompt, $this->timeout);

        return $this->stripCodeBlock($response);
    }

    /**
     * Judge the current solution against the official sample cases and, while a
     * runnable language keeps producing a wrong verdict, re-prompt the model with
     * the failing case to repair it — up to a bounded number of attempts.
     * Returns the best (last) solution code. When there are no samples, or the
     * language can't be run locally, the generated code is returned unchanged.
     */
    protected function verifyAndRepairSolution(CodeforcesSolution $solution, string $parsedJson, string $language): string
    {
        $sampleTests = $this->extractSampleTests($solution);
        $code = (string) $solution->solution_code;
        if (empty($sampleTests)) {
            return $code;
        }

        $maxAttempts = max(1, (int) config('services.ai.codeforces.max_attempts', 3));
        $total = count($sampleTests);
        $bestCode = $code;
        $bestScore = -1;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $solution->solution_code = $code;
            $solution->generated_tests = $sampleTests;
            $result = $this->judge->judge($solution)->toArray();

            // The judge couldn't actually execute this language (e.g. C++ with no
            // local toolchain) — we can't verify correctness, so keep the code.
            if (! ($result['executed'] ?? false)) {
                return $bestScore >= 0 ? $bestCode : $code;
            }

            // Keep the BEST attempt by samples passed. Sample parsing can be noisy
            // for multi-test problems, so a repair that scores worse must never
            // replace a stronger earlier solution.
            $score = $this->acceptedCount($result);
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestCode = $code;
            }

            if ($score >= $total || $attempt === $maxAttempts) {
                break;
            }

            $repaired = $this->repairSolution($parsedJson, $language, $code, $sampleTests, $result);
            if (trim($repaired) === '') {
                break;
            }
            $code = $repaired;
        }

        return $bestCode;
    }

    /**
     * Number of sample cases that passed (verdict accepted). Returns -1 when the
     * judge could not execute, so callers can distinguish "0 passed" from "not run".
     */
    protected function acceptedCount(array $result): int
    {
        if (! ($result['executed'] ?? false)) {
            return -1;
        }
        $count = 0;
        foreach (($result['test_cases'] ?? []) as $case) {
            if (($case['verdict'] ?? '') === 'accepted') {
                $count++;
            }
        }

        return $count;
    }

    /**
     * A generated solution is complete only when every executed verification case
     * passes. If the judge cannot execute the language, keep the old behavior and
     * surface the generated solution with a not-run judge result.
     */
    protected function hasFailedVerification(array $result): bool
    {
        if (! ($result['executed'] ?? false)) {
            return false;
        }

        foreach (($result['test_cases'] ?? []) as $case) {
            if (($case['verdict'] ?? '') !== 'accepted') {
                return true;
            }
        }

        return false;
    }

    /**
     * Re-prompt the model to fix a solution that failed an official sample,
     * feeding it the exact failing input / expected / actual output.
     */
    protected function repairSolution(string $parsedJson, string $language, string $previousCode, array $sampleTests, array $judgeResult): string
    {
        $failing = $this->firstFailingCase($sampleTests, $judgeResult);
        $system = CodeforcesPrompts::repairSolution($language);
        $prompt = $system
            ."\n\n<problem>\n".$parsedJson."\n</problem>"
            ."\n\n<previous_solution>\n".$previousCode."\n</previous_solution>"
            ."\n\n<failing_case>\nverdict:\n".$failing['verdict']
            ."\ninput:\n".$failing['input']
            ."\nexpected_output:\n".$failing['expected']
            ."\nactual_output:\n".$failing['actual']."\n</failing_case>";

        return $this->stripCodeBlock($this->ai->generate($prompt, $this->timeout));
    }

    /**
     * Resolve the first non-accepted case into {verdict, input, expected, actual}
     * using the sample inputs (judge results don't echo the input back). The
     * verdict lets the repair prompt target the right failure class (WA/TLE/RE).
     *
     * @return array{verdict: string, input: string, expected: string, actual: string}
     */
    protected function firstFailingCase(array $sampleTests, array $judgeResult): array
    {
        foreach (($judgeResult['test_cases'] ?? []) as $case) {
            if (($case['verdict'] ?? '') === 'accepted') {
                continue;
            }
            $index = (int) ($case['index'] ?? 0);
            $sample = $sampleTests[$index] ?? ($sampleTests[0] ?? []);
            $actual = trim((string) ($case['stdout'] ?? ''));
            if ($actual === '') {
                $actual = trim((string) ($case['stderr'] ?? '')) ?: '(no output)';
            }

            return [
                'verdict' => (string) ($case['verdict'] ?? 'wrong_answer'),
                'input' => (string) ($sample['input'] ?? ''),
                'expected' => (string) ($sample['expected_output'] ?? ''),
                'actual' => $actual,
            ];
        }

        $first = $sampleTests[0] ?? [];

        return [
            'verdict' => 'wrong_answer',
            'input' => (string) ($first['input'] ?? ''),
            'expected' => (string) ($first['expected_output'] ?? ''),
            'actual' => '(no output)',
        ];
    }

    protected function generateExplanation(string $parsedJson, string $solutionCode, string $responseLanguage = 'ar', string $solutionLanguage = 'python'): string
    {
        $system = CodeforcesPrompts::generateExplanation($responseLanguage, $solutionLanguage);
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";

        return trim($this->ai->generate($prompt, $this->timeout));
    }

    protected function generateTests(string $parsedJson, string $solutionCode): array
    {
        $system = CodeforcesPrompts::generateTests();
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";
        $response = $this->ai->generate($prompt, $this->timeout);
        $response = $this->stripJsonFromResponse($response);
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            return [];
        }
        $tests = [];
        foreach ($decoded as $t) {
            if (isset($t['input']) && (isset($t['expected_output']) || array_key_exists('expected_output', $t))) {
                $tests[] = [
                    'input' => (string) $t['input'],
                    'expected_output' => (string) ($t['expected_output'] ?? ''),
                ];
            }
        }

        return $tests;
    }

    /**
     * Authoritative sample tests for a solution. Prefers DETERMINISTIC extraction
     * from the raw statement (reliable for multi-test problems, where the LLM
     * parser tends to mis-split a single multi-test example into fragments), and
     * falls back to the model-parsed examples.
     */
    protected function extractSampleTests(CodeforcesSolution $solution): array
    {
        $fromRaw = $this->extractExamplesFromRawText((string) $solution->problem_text);
        if (! empty($fromRaw)) {
            return $fromRaw;
        }

        return $this->extractExampleTests($solution->parsed_problem);
    }

    /**
     * Deterministically pull sample Input/Output pairs out of the raw statement.
     * Codeforces statements end with an "Example(s)" section containing one or
     * more "Input ... Output ..." blocks; for multi-test problems the whole input
     * block (leading t + all cases) is a single example. Returns [] when no
     * recognizable example section is present (caller falls back to the parser).
     *
     * @return array<int, array{input: string, expected_output: string}>
     */
    protected function extractExamplesFromRawText(string $raw): array
    {
        $raw = str_replace(["\r\n", "\r"], "\n", $raw);
        // Drop lone "Copy" artifact lines produced by the Codeforces web "Copy" buttons.
        $raw = preg_replace('/^\s*Copy\s*$/im', '', (string) $raw);

        // Isolate the region after the LAST "Example(s)" header so the input/output
        // format headers earlier in the statement aren't mistaken for samples.
        if (! preg_match_all('/(^|\n)\s*examples?\s*(\n|$)/i', $raw, $m, PREG_OFFSET_CAPTURE)) {
            return [];
        }
        $last = end($m[0]);
        $region = substr($raw, $last[1] + strlen($last[0]));

        $tests = [];
        $re = '/input[^\S\n]*\n(.*?)\n[^\S\n]*output[^\S\n]*\n(.*?)(?=\n[^\S\n]*input[^\S\n]*\n|\n[^\S\n]*note\b|\z)/is';
        if (preg_match_all($re, $region, $pairs, PREG_SET_ORDER)) {
            foreach ($pairs as $pair) {
                $input = trim($pair[1], "\n");
                if (trim($input) === '') {
                    continue;
                }
                $tests[] = [
                    'input' => $input,
                    'expected_output' => trim($pair[2], "\n"),
                ];
            }
        }

        return $tests;
    }

    /**
     * Turn the parsed problem's sample examples ([{input, output}]) into runnable
     * test cases ([{input, expected_output}]). Fallback when deterministic raw-text
     * extraction finds nothing.
     */
    protected function extractExampleTests(mixed $parsedProblem): array
    {
        $parsed = is_array($parsedProblem) ? $parsedProblem : json_decode((string) $parsedProblem, true);
        $examples = is_array($parsed) ? ($parsed['examples'] ?? []) : [];
        if (! is_array($examples)) {
            return [];
        }

        $tests = [];
        foreach ($examples as $ex) {
            if (! is_array($ex) || ! isset($ex['input'])) {
                continue;
            }
            $tests[] = [
                'input' => $this->sanitizeExampleInput((string) $ex['input']),
                'expected_output' => (string) ($ex['output'] ?? $ex['expected_output'] ?? ''),
            ];
        }

        return $tests;
    }

    /**
     * Defensive cleanup: parsers sometimes leak the expected-output section into
     * the example input (e.g. a trailing "output: ...") — strip it so the judge
     * feeds the program only the real stdin. A literal "output:" line never
     * appears in genuine competitive-programming input.
     */
    protected function sanitizeExampleInput(string $input): string
    {
        if (preg_match('/\R\s*output\s*:/i', $input)) {
            $input = preg_split('/\R\s*output\s*:/i', $input)[0];
        }

        return rtrim($input);
    }

    /**
     * Merge sample tests with AI tests, dropping duplicate inputs (samples win).
     */
    protected function mergeTests(array $exampleTests, array $aiTests): array
    {
        $merged = $exampleTests;
        $seen = [];
        foreach ($exampleTests as $t) {
            $seen[trim((string) ($t['input'] ?? ''))] = true;
        }
        foreach ($aiTests as $t) {
            $key = trim((string) ($t['input'] ?? ''));
            if ($key !== '' && isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $merged[] = $t;
        }

        return $merged;
    }

    protected function generateAlgorithmBreakdown(string $parsedJson, string $solutionCode, string $responseLanguage = 'ar', string $solutionLanguage = 'python'): string
    {
        $system = CodeforcesPrompts::generateAlgorithmBreakdown($responseLanguage, $solutionLanguage);
        $prompt = $system."\n\n<user_content>\n".$parsedJson."\n</user_content>\n\n<solution_code>\n".$solutionCode."\n</solution_code>";

        return trim($this->ai->generate($prompt, $this->timeout));
    }

    protected function stripJsonFromResponse(string $response): string
    {
        $response = trim($response);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $response, $m)) {
            return trim($m[1]);
        }

        return $response;
    }

    protected function stripCodeBlock(string $response): string
    {
        $response = trim($response);
        if (preg_match('/```(?:\w+)?\s*([\s\S]*?)```/', $response, $m)) {
            return trim($m[1]);
        }

        return $response;
    }

    private function persistVerificationRun(CodeforcesSolution $solution, array $judgeResult): void
    {
        try {
            $testCases = $judgeResult['test_cases'] ?? [];
            $overallVerdict = VerificationRun::VERDICT_NOT_RUN;

            if ($judgeResult['executed'] ?? false) {
                $overallVerdict = VerificationRun::VERDICT_ACCEPTED;
                foreach ($testCases as $tc) {
                    if (($tc['verdict'] ?? '') !== 'accepted') {
                        $overallVerdict = $tc['verdict'];
                        break;
                    }
                }
            }

            $maxRuntimeMs = null;
            foreach ($testCases as $tc) {
                $rt = $tc['runtime_ms'] ?? null;
                if ($rt !== null && ($maxRuntimeMs === null || $rt > $maxRuntimeMs)) {
                    $maxRuntimeMs = $rt;
                }
            }

            VerificationRun::create([
                'codeforces_solution_id' => $solution->id,
                'language' => $solution->solution_language ?? 'python',
                'status' => VerificationRun::STATUS_COMPLETED,
                'verdict' => $overallVerdict,
                'source_code' => $solution->solution_code,
                'tests_json' => $solution->generated_tests,
                'run_results_json' => $testCases,
                'runtime_ms' => $maxRuntimeMs,
                'error_message' => $judgeResult['message'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('verification_run.persist.failed', [
                'solution_id' => $solution->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function usage(): AiUsageService
    {
        return $this->usage ??= app(AiUsageService::class);
    }
}
