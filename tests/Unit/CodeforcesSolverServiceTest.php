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
        'generated_tests' => 'array',
        'run_results' => 'array',
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
        $service = $this->createServiceWithMockOllama([
            $parsed,
            '#include <iostream>',
            'شرح الحل',
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
        $service = $this->createServiceWithMockOllama([
            $parsed,
            'print(1)',
            'Explanation',
            '[]',
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
            'code',
            'expl',
            '[]',
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
        $service = $this->createServiceWithMockOllama([
            $parsed,
            'code',
            'expl',
            'not json',
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
        $testsJson = '[{"input":"1","expected_output":"1"},{"input":"2"},{"wrong":true}]';
        $service = $this->createServiceWithMockOllama([
            $parsed,
            'code',
            'expl',
            $testsJson,
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

    public function test_run_pipeline_uses_parsed_problem_string_branch_when_not_array(): void
    {
        $parsed = json_encode(['title' => 'FromString', 'description' => 'D', 'examples' => []]);
        $ollama = $this->createMock(OllamaService::class);
        $ollama->method('generate')->willReturnCallback(function () use ($parsed) {
            static $index = 0;
            $responses = [$parsed, 'int main() {}', 'Explanation', '[]', 'Algo'];

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
