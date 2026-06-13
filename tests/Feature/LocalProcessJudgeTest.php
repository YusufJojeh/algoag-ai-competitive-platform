<?php

namespace Tests\Feature;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\Judges\LocalProcessJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Integration tests for the LocalProcessJudge.
 * These tests actually execute Python code — no mocking.
 * They require Python 3 to be installed and accessible.
 */
class LocalProcessJudgeTest extends TestCase
{
    use RefreshDatabase;

    private LocalProcessJudge $judge;

    protected function setUp(): void
    {
        parent::setUp();
        $this->judge = new LocalProcessJudge();
    }

    private function makeSolution(string $code, string $language, array $tests): CodeforcesSolution
    {
        return CodeforcesSolution::factory()->create([
            'solution_code' => $code,
            'solution_language' => $language,
            'generated_tests' => $tests,
            'status' => CodeforcesSolution::STATUS_COMPLETED,
        ]);
    }

    public function test_accepted_solution_returns_accepted(): void
    {
        $code = <<<'PYTHON'
n = int(input())
print(n * 2)
PYTHON;

        $solution = $this->makeSolution($code, 'python', [
            ['input' => '3', 'expected_output' => '6'],
            ['input' => '5', 'expected_output' => '10'],
            ['input' => '0', 'expected_output' => '0'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertInstanceOf(VerificationRunResult::class, $result);
        $this->assertTrue($result->executed);
        $this->assertNotEmpty($result->testCases);

        foreach ($result->testCases as $tc) {
            $this->assertSame('accepted', $tc['verdict'],
                "Test case {$tc['index']} expected 'accepted', got '{$tc['verdict']}'. stdout: " . ($tc['stdout'] ?? ''));
        }
    }

    public function test_wrong_solution_returns_wrong_answer(): void
    {
        $code = <<<'PYTHON'
n = int(input())
print(n * 3)   # wrong: should be * 2
PYTHON;

        $solution = $this->makeSolution($code, 'python', [
            ['input' => '3', 'expected_output' => '6'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('wrong_answer', $result->testCases[0]['verdict']);
    }

    public function test_syntax_error_returns_compilation_error(): void
    {
        $code = "def broken(:\n    pass";

        $solution = $this->makeSolution($code, 'python', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('compilation_error', $result->testCases[0]['verdict']);
        $this->assertNotEmpty($result->testCases[0]['stderr']);
    }

    public function test_runtime_exception_returns_runtime_error(): void
    {
        $code = <<<'PYTHON'
x = 1 / 0   # ZeroDivisionError
PYTHON;

        $solution = $this->makeSolution($code, 'python', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('runtime_error', $result->testCases[0]['verdict']);
        $this->assertNotSame(0, $result->testCases[0]['exit_code']);
    }

    public function test_infinite_loop_returns_time_limit_exceeded(): void
    {
        $code = <<<'PYTHON'
while True:
    pass
PYTHON;

        $solution = $this->makeSolution($code, 'python', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('time_limit_exceeded', $result->testCases[0]['verdict']);
    }

    public function test_unsupported_language_returns_not_executed(): void
    {
        $solution = $this->makeSolution('puts "hi"', 'ruby', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertFalse($result->executed);
        $this->assertStringContainsString('not supported', $result->message);
    }

    public function test_empty_tests_returns_not_executed(): void
    {
        $solution = $this->makeSolution('print("hello")', 'python', []);

        $result = $this->judge->judge($solution);

        $this->assertFalse($result->executed);
        $this->assertStringContainsString('No test cases', $result->message);
    }

    public function test_empty_code_returns_not_executed(): void
    {
        $solution = $this->makeSolution('', 'python', [
            ['input' => '1', 'expected_output' => '1'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertFalse($result->executed);
        $this->assertStringContainsString('No solution code', $result->message);
    }

    public function test_result_includes_runtime_ms(): void
    {
        $code = "print('ok')";
        $solution = $this->makeSolution($code, 'python', [
            ['input' => '', 'expected_output' => 'ok'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertArrayHasKey('runtime_ms', $result->testCases[0]);
        $this->assertIsInt($result->testCases[0]['runtime_ms']);
    }

    /**
     * Detect whether a C++ toolchain is available; otherwise skip the C++ suite
     * so CI stays green on machines without g++.
     */
    private function requireGpp(): void
    {
        foreach (['g++', 'c++'] as $candidate) {
            $probe = new \Symfony\Component\Process\Process([$candidate, '--version']);
            try {
                $probe->run();
                if ($probe->isSuccessful()) {
                    return;
                }
            } catch (\Throwable) {
                // try next
            }
        }

        $this->markTestSkipped('g++ is not installed; skipping C++ judge tests.');
    }

    public function test_cpp_accepted_solution_returns_accepted(): void
    {
        $this->requireGpp();

        $code = <<<'CPP'
#include <iostream>
int main() {
    long long n;
    std::cin >> n;
    std::cout << n * 2 << std::endl;
    return 0;
}
CPP;

        $solution = $this->makeSolution($code, 'cpp', [
            ['input' => '3', 'expected_output' => '6'],
            ['input' => '5', 'expected_output' => '10'],
            ['input' => '0', 'expected_output' => '0'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertNotEmpty($result->testCases);
        foreach ($result->testCases as $tc) {
            $this->assertSame('accepted', $tc['verdict'],
                "C++ case {$tc['index']} expected 'accepted', got '{$tc['verdict']}'. stderr: " . ($tc['stderr'] ?? ''));
        }
    }

    public function test_cpp_wrong_solution_returns_wrong_answer(): void
    {
        $this->requireGpp();

        $code = <<<'CPP'
#include <iostream>
int main() {
    long long n;
    std::cin >> n;
    std::cout << n * 3 << std::endl; // wrong: should be * 2
    return 0;
}
CPP;

        $solution = $this->makeSolution($code, 'cpp', [
            ['input' => '3', 'expected_output' => '6'],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('wrong_answer', $result->testCases[0]['verdict']);
    }

    public function test_cpp_compile_error_returns_compilation_error(): void
    {
        $this->requireGpp();

        // Missing semicolon / undeclared — will not compile.
        $code = "int main() { return notDeclared }";

        $solution = $this->makeSolution($code, 'cpp', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('compilation_error', $result->testCases[0]['verdict']);
        $this->assertNotEmpty($result->testCases[0]['stderr']);
    }

    public function test_cpp_runtime_error_returns_runtime_error(): void
    {
        $this->requireGpp();

        $code = <<<'CPP'
#include <cstdlib>
int main() {
    return 1; // non-zero exit
}
CPP;

        $solution = $this->makeSolution($code, 'cpp', [
            ['input' => '', 'expected_output' => ''],
        ]);

        $result = $this->judge->judge($solution);

        $this->assertTrue($result->executed);
        $this->assertSame('runtime_error', $result->testCases[0]['verdict']);
    }

    public function test_cpp_infinite_loop_returns_time_limit_exceeded(): void
    {
        $this->requireGpp();

        $code = <<<'CPP'
int main() {
    while (true) {}
    return 0;
}
CPP;

        // Tight time limit so the test stays fast.
        $result = $this->judge->run($code, 'cpp', [
            ['input' => '', 'expected_output' => ''],
        ], ['time_limit_seconds' => 2]);

        $this->assertTrue($result->executed);
        $this->assertSame('time_limit_exceeded', $result->testCases[0]['verdict']);
    }

    public function test_run_entry_point_judges_python_without_a_model(): void
    {
        $result = $this->judge->run("print(int(input()) + 1)", 'python', [
            ['input' => '41', 'expected_output' => '42'],
        ]);

        $this->assertTrue($result->executed);
        $this->assertSame('accepted', $result->testCases[0]['verdict']);
    }
}
