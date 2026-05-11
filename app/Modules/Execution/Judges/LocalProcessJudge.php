<?php

namespace App\Modules\Execution\Judges;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use Symfony\Component\Process\Process;

/**
 * Real local code judge for Python 3.
 * Runs user code in isolated temp directories with enforced timeouts.
 * Does NOT enforce memory limits on Windows (ulimit unavailable).
 * Security: never concatenates raw user code into shell strings.
 */
class LocalProcessJudge implements CodeJudge
{
    /** Seconds per test case. */
    private int $timeLimitSeconds;

    /** Python executable — detected at construction time. */
    private string $pythonBin;

    public function __construct()
    {
        $this->timeLimitSeconds = (int) config('judge.time_limit_seconds', 10);
        $this->pythonBin = $this->detectPython();
    }

    public function judge(CodeforcesSolution $solution): VerificationRunResult
    {
        $tests = $solution->generated_tests ?? [];
        $code = (string) ($solution->solution_code ?? '');
        $language = (string) ($solution->solution_language ?? 'python');

        if ($language !== 'python') {
            return new VerificationRunResult(
                engine: 'local_process',
                executed: false,
                message: "Language '{$language}' is not supported by the local judge. Only Python 3 is supported.",
                testCases: [],
                completedAt: now()->toIso8601String(),
            );
        }

        if (empty($code)) {
            return new VerificationRunResult(
                engine: 'local_process',
                executed: false,
                message: 'No solution code found.',
                testCases: [],
                completedAt: now()->toIso8601String(),
            );
        }

        if (empty($tests)) {
            return new VerificationRunResult(
                engine: 'local_process',
                executed: false,
                message: 'No test cases found.',
                testCases: [],
                completedAt: now()->toIso8601String(),
            );
        }

        $tempDir = $this->createTempDir();

        try {
            $syntaxError = $this->checkSyntax($code, $tempDir);
            if ($syntaxError !== null) {
                return new VerificationRunResult(
                    engine: 'local_process',
                    executed: true,
                    message: 'Syntax error detected before running tests.',
                    testCases: [['index' => 0, 'verdict' => 'compilation_error', 'stderr' => $syntaxError]],
                    completedAt: now()->toIso8601String(),
                );
            }

            $codeFile = $tempDir . DIRECTORY_SEPARATOR . 'solution.py';
            file_put_contents($codeFile, $code);

            $cases = [];
            $overallVerdict = 'accepted';

            foreach ($tests as $i => $test) {
                $input = (string) ($test['input'] ?? '');
                $expected = trim((string) ($test['expected_output'] ?? ''));

                $result = $this->runTest($codeFile, $input, $expected, $i);
                $cases[] = $result;

                if ($result['verdict'] !== 'accepted' && $overallVerdict === 'accepted') {
                    $overallVerdict = $result['verdict'];
                }
            }

            return new VerificationRunResult(
                engine: 'local_process',
                executed: true,
                message: $overallVerdict === 'accepted'
                    ? 'All test cases passed.'
                    : "Verdict: {$overallVerdict}",
                testCases: $cases,
                completedAt: now()->toIso8601String(),
            );

        } finally {
            $this->cleanupDir($tempDir);
        }
    }

    /**
     * Run a single test case against expected output.
     *
     * @return array<string, mixed>
     */
    private function runTest(string $codeFile, string $input, string $expected, int $index): array
    {
        $start = microtime(true);

        $process = new Process(
            [$this->pythonBin, '-u', $codeFile],
            null,
            null,
            $input,
            $this->timeLimitSeconds,
        );

        try {
            $process->run();
        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException) {
            return [
                'index' => $index,
                'verdict' => 'time_limit_exceeded',
                'runtime_ms' => (int) ($this->timeLimitSeconds * 1000),
                'stdout' => '',
                'stderr' => 'Process exceeded time limit.',
                'exit_code' => null,
            ];
        }

        $runtimeMs = (int) ((microtime(true) - $start) * 1000);
        $stdout = $process->getOutput();
        $stderr = $process->getErrorOutput();
        $exitCode = $process->getExitCode();

        if ($exitCode !== 0) {
            return [
                'index' => $index,
                'verdict' => 'runtime_error',
                'runtime_ms' => $runtimeMs,
                'stdout' => $stdout,
                'stderr' => $stderr,
                'exit_code' => $exitCode,
            ];
        }

        // Compare output — normalize trailing whitespace per competitive programming convention
        $actual = trim($stdout);
        $verdict = ($actual === $expected) ? 'accepted' : 'wrong_answer';

        return [
            'index' => $index,
            'verdict' => $verdict,
            'runtime_ms' => $runtimeMs,
            'stdout' => $stdout,
            'stderr' => $stderr,
            'exit_code' => $exitCode,
            'expected' => $expected,
        ];
    }

    /**
     * Check Python syntax without running the code.
     * Returns null if no error, or the error message string.
     */
    private function checkSyntax(string $code, string $tempDir): ?string
    {
        $checkFile = $tempDir . DIRECTORY_SEPARATOR . 'syntax_check.py';
        file_put_contents($checkFile, $code);

        $process = new Process(
            [$this->pythonBin, '-m', 'py_compile', $checkFile],
            null,
            null,
            null,
            10,
        );
        $process->run();

        if ($process->getExitCode() !== 0) {
            return $process->getErrorOutput() ?: 'Syntax error (no details available).';
        }

        return null;
    }

    private function createTempDir(): string
    {
        // Use cryptographically random bytes so the directory name is unpredictable.
        // uniqid() was microtime-based and could be guessed on shared hosts.
        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'judge_' . bin2hex(random_bytes(16));
        if (! mkdir($dir, 0700, true) && ! is_dir($dir)) {
            throw new \RuntimeException('Failed to create judge temp dir.');
        }

        return $dir;
    }

    private function cleanupDir(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        try {
            // Use RecursiveIterator so __pycache__ and any sub-dirs are fully removed.
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST,
            );

            foreach ($iterator as $entry) {
                if ($entry->isDir()) {
                    @rmdir($entry->getPathname());
                } else {
                    @unlink($entry->getPathname());
                }
            }

            if (! @rmdir($dir)) {
                \Illuminate\Support\Facades\Log::warning('judge.cleanup.rmdir_failed', ['dir' => basename($dir)]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('judge.cleanup.failed', [
                'dir' => basename($dir),
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function detectPython(): string
    {
        // Try candidates in order; use first that exists
        $candidates = ['python', 'python3', 'C:\\Python314\\python.exe'];

        foreach ($candidates as $candidate) {
            $probe = new Process([$candidate, '--version']);
            try {
                $probe->run();
                if ($probe->isSuccessful()) {
                    return $candidate;
                }
            } catch (\Throwable) {
                // try next
            }
        }

        // Fall back and let the OS throw when it actually runs
        return 'python';
    }
}
