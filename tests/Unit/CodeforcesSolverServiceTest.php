<?php

namespace Tests\Unit;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use App\Services\CodeforcesSolverService;
use App\Services\OllamaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Stub model that exposes parsed_problem as string (no array cast) so the
 * service's "non-array" branch is covered.
 */
class CodeforcesSolutionStubForCoverage extends CodeforcesSolution
{
    protected $casts = [
        'problem_text_translations' => 'array',
        'parsed_problem_translations' => 'array',
        'explanation_translations' => 'array',
        'generated_tests' => 'array',
        'run_results' => 'array',
        'algorithm_breakdown_translations' => 'array',
    ];

    public function setAttribute($key, $value): static
    {
        if ($key === 'parsed_problem' && is_array($value)) {
            $this->attributes[$key] = json_encode($value, JSON_UNESCAPED_UNICODE);

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function getAttribute($key): mixed
    {
        if ($key === 'parsed_problem') {
            return $this->attributes[$key] ?? '';
        }

        return parent::getAttribute($key);
    }
}

class CodeforcesSolverServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    protected function createServiceWithMockOllama(array $responses): CodeforcesSolverService
    {
        $ollama = $this->createMock(OllamaService::class);
        $index = 0;
        $ollama->method('generate')->willReturnCallback(function () use ($responses, &$index) {
            $out = $responses[$index] ?? '';
            $index++;

            return $out;
        });

        $judge = $this->createMock(CodeJudge::class);
        $judge->method('judge')->willReturn(new VerificationRunResult(
            'stub',
            false,
            '',
            [],
            now()->toIso8601String()
        ));

        return new CodeforcesSolverService($ollama, $judge);
    }

    public function test_run_pipeline_completes_solution(): void
    {
        $parsed = json_encode(['title' => 'Max', 'description' => 'Find max', 'examples' => []]);
        $localized = json_encode([
            'ar' => ['title' => 'أكبر قيمة', 'description' => 'أوجد أكبر قيمة', 'examples' => []],
            'en' => ['title' => 'Max', 'description' => 'Find max', 'examples' => []],
        ], JSON_UNESCAPED_UNICODE);
        $service = $this->createServiceWithMockOllama([
            $parsed,
            $localized,
            '#include <iostream>',
            'شرح الحل',
            'English explanation',
            '[{"input":"1","expected_output":"1"}]',
            'خوارزمية: O(n)',
        ]);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Find the maximum in an array.',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_COMPLETED, $solution->status);
        $this->assertIsArray($solution->parsed_problem);
        $this->assertSame('Max', $solution->parsed_problem['title']);
        $this->assertStringContainsString('iostream', $solution->solution_code);
        $this->assertSame('cpp', $solution->solution_language);
        $this->assertSame('English explanation', $solution->explanation_translations['en']);
        $this->assertSame('Max', $solution->parsed_problem_translations['en']['title']);
        $this->assertSame('شرح الحل', $solution->explanation);
        $this->assertCount(1, $solution->generated_tests);
        $this->assertSame('خوارزمية: O(n)', $solution->algorithm_breakdown);
        $this->assertIsArray($solution->run_results);
    }

    public function test_run_pipeline_sets_failed_status_on_ollama_throw(): void
    {
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willThrowException(new \RuntimeException('Ollama timeout'));
        $judge = $this->createMock(CodeJudge::class);
        $service = new CodeforcesSolverService($ollama, $judge);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Some problem.',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_FAILED, $solution->status);
        // SEC-01: raw exception must NOT be exposed to clients.
        $this->assertStringNotContainsString('Ollama timeout', (string) $solution->error_message);
        $this->assertSame('تعذر إكمال العملية. حاول مرة أخرى.', $solution->error_message);
    }

    public function test_pipeline_error_message_never_contains_exception_details(): void
    {
        $sensitiveMessage = 'DB password is s3cr3t and host is 10.0.0.1';
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willThrowException(new \RuntimeException($sensitiveMessage));
        $judge = $this->createMock(CodeJudge::class);
        $service = new CodeforcesSolverService($ollama, $judge);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Some problem.',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_FAILED, $solution->status);
        $this->assertStringNotContainsString('s3cr3t', (string) $solution->error_message);
        $this->assertStringNotContainsString('10.0.0.1', (string) $solution->error_message);
        $this->assertStringNotContainsString('password', (string) $solution->error_message);
    }

    public function test_run_pipeline_uses_python_language(): void
    {
        $parsed = json_encode(['title' => 'P', 'examples' => []]);
        $localized = json_encode(['ar' => ['title' => 'P', 'examples' => []], 'en' => ['title' => 'P', 'examples' => []]]);
        $service = $this->createServiceWithMockOllama([
            $parsed,
            $localized,
            'print(1)',
            'شرح',
            'Explanation',
            '[]',
            'تحليل',
            'Algo',
        ]);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Problem',
            'solution_language' => 'python',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame('python', $solution->solution_language);
    }

    public function test_parse_fallback_when_ollama_returns_invalid_json(): void
    {
        $service = $this->createServiceWithMockOllama([
            'not valid json at all',
            '{"ar":{"description":"My problem text here.","examples":[]},"en":{"description":"My problem text here.","examples":[]}}',
            'code',
            'شرح',
            'expl',
            '[]',
            'تحليل',
            'algo',
        ]);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'My problem text here.',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_COMPLETED, $solution->status);
        $this->assertSame('', $solution->parsed_problem['title']);
        $this->assertSame('My problem text here.', $solution->parsed_problem['description']);
        $this->assertSame([], $solution->parsed_problem['examples']);
    }

    public function test_generate_tests_fallback_when_invalid_json(): void
    {
        $parsed = json_encode(['title' => 'P', 'examples' => []]);
        $localized = json_encode(['ar' => ['title' => 'P', 'examples' => []], 'en' => ['title' => 'P', 'examples' => []]]);
        $service = $this->createServiceWithMockOllama([
            $parsed,
            $localized,
            'code',
            'شرح',
            'expl',
            'not json',
            'تحليل',
            'algo',
        ]);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'P',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame([], $solution->generated_tests);
    }

    public function test_generate_tests_filters_invalid_entries(): void
    {
        $parsed = json_encode(['title' => 'P', 'examples' => []]);
        $localized = json_encode(['ar' => ['title' => 'P', 'examples' => []], 'en' => ['title' => 'P', 'examples' => []]]);
        $testsJson = '[{"input":"1","expected_output":"1"},{"input":"2"},{"wrong":true}]';
        $service = $this->createServiceWithMockOllama([
            $parsed,
            $localized,
            'code',
            'شرح',
            'expl',
            $testsJson,
            'تحليل',
            'algo',
        ]);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'P',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertCount(1, $solution->generated_tests);
        $this->assertSame('1', $solution->generated_tests[0]['input']);
        $this->assertSame('1', $solution->generated_tests[0]['expected_output']);
    }

    public function test_pipeline_self_repairs_when_official_sample_fails(): void
    {
        // Parsed problem carries an official sample, so the verify-and-repair loop engages.
        $parsed = json_encode([
            'title' => 'Beautiful Year',
            'examples' => [['input' => '1987', 'output' => '2013']],
        ]);
        $localized = json_encode([
            'ar' => ['title' => 'Beautiful Year', 'examples' => [['input' => '1987', 'output' => '2013']]],
            'en' => ['title' => 'Beautiful Year', 'examples' => [['input' => '1987', 'output' => '2013']]],
        ]);

        // generate() order: parse, solution(buggy), repair(fixed), explanation, tests, breakdown.
        $responses = [
            $parsed,
            $localized,
            'print("buggy")',   // initial solution — fails the sample
            'print(2013)',      // repaired solution — passes
            'الشرح',
            '[]',
            'تحليل',
        ];
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willReturnCallback(function () use ($responses) {
            static $i = 0;

            return $responses[$i++] ?? '';
        });

        // Judge: sample fails first, passes after repair, then final display judge passes.
        $judge = $this->createMock(CodeJudge::class);
        $judge->method('judge')->willReturnCallback(function () {
            static $i = 0;
            $i++;
            $verdict = $i === 1 ? 'wrong_answer' : 'accepted';

            return new VerificationRunResult(
                'stub',
                true,
                'msg',
                [['index' => 0, 'verdict' => $verdict, 'stdout' => '1989']],
                now()->toIso8601String(),
            );
        });

        $service = new CodeforcesSolverService($ollama, $judge);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Beautiful Year problem.',
            'solution_language' => 'python',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_COMPLETED, $solution->status);
        // The repaired solution replaced the buggy one.
        $this->assertSame('print(2013)', $solution->solution_code);
    }

    public function test_run_pipeline_marks_failed_when_executed_verification_fails(): void
    {
        $parsed = json_encode([
            'title' => 'Watermelon',
            'examples' => [['input' => '8', 'output' => 'YES']],
        ]);
        $localized = json_encode([
            'ar' => ['title' => 'Watermelon', 'examples' => [['input' => '8', 'output' => 'YES']]],
            'en' => ['title' => 'Watermelon', 'examples' => [['input' => '8', 'output' => 'YES']]],
        ]);

        $responses = [
            $parsed,
            $localized,
            'print("NO")',
            'print("NO")',
            'print("NO")',
            'الشرح',
            '[]',
        ];
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willReturnCallback(function () use ($responses) {
            static $i = 0;

            return $responses[$i++] ?? '';
        });

        $judge = $this->createMock(CodeJudge::class);
        $judge->method('judge')->willReturn(new VerificationRunResult(
            'stub',
            true,
            'Verdict: runtime_error',
            [['index' => 0, 'verdict' => 'runtime_error', 'stdout' => '', 'stderr' => 'boom']],
            now()->toIso8601String(),
        ));

        $service = new CodeforcesSolverService($ollama, $judge);

        $solution = CodeforcesSolution::create([
            'problem_text' => 'Watermelon problem.',
            'solution_language' => 'python',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertSame(CodeforcesSolution::STATUS_FAILED, $solution->status);
        $this->assertSame(CodeforcesSolution::STAGE_FAILED, $solution->progress_stage);
        $this->assertSame('runtime_error', $solution->run_results['test_cases'][0]['verdict']);
        $this->assertNotNull($solution->error_message);
    }

    public function test_run_pipeline_uses_parsed_problem_string_branch_when_not_array(): void
    {
        $parsed = json_encode(['title' => 'FromString', 'description' => 'D', 'examples' => []]);
        $localized = json_encode(['ar' => ['title' => 'FromString', 'description' => 'D', 'examples' => []], 'en' => ['title' => 'FromString', 'description' => 'D', 'examples' => []]]);
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willReturnCallback(function () use ($parsed, $localized) {
            static $index = 0;
            $responses = [$parsed, $localized, 'int main() {}', 'شرح', 'Explanation', '[]', 'تحليل', 'Algo'];

            return $responses[$index++] ?? '';
        });
        $judge = $this->createMock(CodeJudge::class);
        $judge->method('judge')->willReturn(new VerificationRunResult(
            'stub',
            false,
            '',
            [],
            now()->toIso8601String()
        ));
        $service = new CodeforcesSolverService($ollama, $judge, CodeforcesSolutionStubForCoverage::class);

        $solution = CodeforcesSolutionStubForCoverage::create([
            'problem_text' => 'Problem text.',
            'solution_language' => 'cpp',
            'status' => CodeforcesSolution::STATUS_PENDING,
        ]);

        $service->runPipeline($solution->id);
        $solution->refresh();

        $this->assertInstanceOf(CodeforcesSolutionStubForCoverage::class, $solution);
        $this->assertSame(CodeforcesSolution::STATUS_COMPLETED, $solution->status);
        $raw = $solution->getAttributes()['parsed_problem'] ?? '';
        $this->assertStringContainsString('FromString', $raw);
    }
}
