<?php

namespace App\Modules\Execution\Judges;

use App\Models\CodeforcesSolution;
use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\DTO\VerificationRunResult;
use Symfony\Component\Process\Process;

/**
 * Real local code judge for Python 3 and C++.
 * Runs user code in isolated temp directories with enforced timeouts.
 * Does NOT enforce memory limits on Windows (ulimit unavailable).
 *
 * SECURITY: This compiles and executes UNTRUSTED user code on the host with no
 * OS-level sandbox. It is acceptable for LOCAL DEVELOPMENT ONLY. Before any
 * production use, run each process inside a sandbox (docker/gvisor/firejail) —
 * see config/judge.php and the production guard in AppServiceProvider.
 * Security: never concatenates raw user code into shell strings (proc_open with
 * bypass_shell + argv arrays).
 */
class LocalProcessJudge implements CodeJudge
{
    private const SUPPORTED_LANGUAGES = ['python', 'cpp'];

    /** Default seconds per test case. */
    private int $timeLimitSeconds;

    /** Python executable — detected at construction time. */
    private string $pythonBin;

    public function __construct()
    {
        $this->timeLimitSeconds = (int) config('judge.time_limit_seconds', 10);
        $this->pythonBin = $this->detectPython();
    }

    /**
     * Judge an AI Codeforces solution (reads code/language/tests off the model).
     */
    public function judge(CodeforcesSolution $solution): VerificationRunResult
    {
        return $this->run(
            (string) ($solution->solution_code ?? ''),
            (string) ($solution->solution_language ?? 'python'),
            $solution->generated_tests ?? [],
        );
    }

    /**
     * Language-agnostic entry point used by both the Codeforces pipeline and the
     * Arena submission judge.
     *
     * @param  array<int, array<string, mixed>>  $tests
     * @param  array{time_limit_seconds?: int}  $limits
     */
    public function run(string $code, string $language, array $tests, array $limits = []): VerificationRunResult
    {
        $language = strtolower(trim($language)) ?: 'python';
        $timeLimit = max(1, (int) ($limits['time_limit_seconds'] ?? $this->timeLimitSeconds));

        if (! in_array($language, self::SUPPORTED_LANGUAGES, true)) {
            return $this->notExecuted(
                "Language '{$language}' is not supported by the local judge. Supported: python, cpp.",
            );
        }

        if (trim($code) === '') {
            return $this->notExecuted('No solution code found.');
        }

        if (empty($tests)) {
            return $this->notExecuted('No test cases found.');
        }

        $tempDir = $this->createTempDir();

        try {
            // Prepare the language-specific run command (compile C++, syntax-check Python).
            $prepared = $this->prepareProgram($language, $code, $tempDir, $timeLimit);

            if ($prepared['error'] !== null) {
                return new VerificationRunResult(
                    engine: 'local_process',
                    executed: true,
                    message: 'Compilation failed before running tests.',
                    testCases: [[
                        'index' => 0,
                        'verdict' => 'compilation_error',
                        'stderr' => $prepared['error'],
                    ]],
                    completedAt: now()->toIso8601String(),
                );
            }

            $command = $prepared['command'];
            $cases = [];
            $overallVerdict = 'accepted';

            foreach ($tests as $i => $test) {
                $input = (string) ($test['input'] ?? '');
                $expected = trim((string) ($test['expected_output'] ?? $test['output'] ?? ''));

                $result = $this->runTest($command, $input, $expected, (int) $i, $timeLimit);
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

    private function notExecuted(string $message): VerificationRunResult
    {
        return new VerificationRunResult(
            engine: 'local_process',
            executed: false,
            message: $message,
            testCases: [],
            completedAt: now()->toIso8601String(),
        );
    }

    /**
     * Write source to disk and produce the per-test run command.
     * For Python: syntax-check via py_compile. For C++: compile with g++.
     *
     * @return array{error: ?string, command: array<int, string>}
     */
    private function prepareProgram(string $language, string $code, string $tempDir, int $timeLimit): array
    {
        if ($language === 'python') {
            $syntaxError = $this->checkPythonSyntax($code, $tempDir);
            if ($syntaxError !== null) {
                return ['error' => $syntaxError, 'command' => []];
            }

            $codeFile = $tempDir . DIRECTORY_SEPARATOR . 'solution.py';
            file_put_contents($codeFile, $code);

            return ['error' => null, 'command' => [$this->pythonBin, '-u', $codeFile]];
        }

        // C++
        $gpp = $this->detectGpp();
        if ($gpp === null) {
            // No toolchain — surface as a compilation error so the verdict is meaningful.
            return ['error' => 'C++ compiler (g++) not found on this machine.', 'command' => []];
        }

        $codeFile = $tempDir . DIRECTORY_SEPARATOR . 'solution.cpp';
        file_put_contents($codeFile, $code);

        $binaryFile = $tempDir . DIRECTORY_SEPARATOR . (PHP_OS_FAMILY === 'Windows' ? 'solution.exe' : 'solution');

        // Give compilation its own (generous) timeout, separate from the run time limit.
        $compile = $this->runCommandWithWallClockTimeout(
            [$gpp, '-O2', '-std=c++17', '-o', $binaryFile, $codeFile],
            null,
            max(30, $timeLimit),
        );

        if ($compile['timed_out']) {
            return ['error' => 'Compilation exceeded time limit.', 'command' => []];
        }

        if ($compile['exit_code'] !== 0 || ! is_file($binaryFile)) {
            return [
                'error' => $compile['stderr'] !== '' ? $compile['stderr'] : 'Compilation failed (no details available).',
                'command' => [],
            ];
        }

        return ['error' => null, 'command' => [$binaryFile]];
    }

    /**
     * Run a single test case against expected output.
     *
     * @param  array<int, string>  $command
     * @return array<string, mixed>
     */
    private function runTest(array $command, string $input, string $expected, int $index, int $timeLimit): array
    {
        $start = microtime(true);

        $run = $this->runCommandWithWallClockTimeout($command, $input, $timeLimit);

        if ($run['timed_out']) {
            return [
                'index' => $index,
                'verdict' => 'time_limit_exceeded',
                'runtime_ms' => (int) ($timeLimit * 1000),
                'stdout' => '',
                'stderr' => 'Process exceeded time limit.',
                'exit_code' => null,
            ];
        }

        $runtimeMs = (int) ((microtime(true) - $start) * 1000);
        $stdout = $run['stdout'];
        $stderr = $run['stderr'];
        $exitCode = $run['exit_code'];

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
    private function checkPythonSyntax(string $code, string $tempDir): ?string
    {
        $checkFile = $tempDir . DIRECTORY_SEPARATOR . 'syntax_check.py';
        file_put_contents($checkFile, $code);

        $run = $this->runCommandWithWallClockTimeout([$this->pythonBin, '-m', 'py_compile', $checkFile], null, 10);

        if ($run['timed_out']) {
            return 'Syntax check exceeded time limit.';
        }

        if ($run['exit_code'] !== 0) {
            return $run['stderr'] ?: 'Syntax error (no details available).';
        }

        return null;
    }

    /**
     * @param  array<int, string>  $command
     * @return array{timed_out: bool, stdout: string, stderr: string, exit_code: ?int}
     */
    private function runCommandWithWallClockTimeout(array $command, ?string $input, int $timeoutSeconds): array
    {
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open($command, $descriptors, $pipes, null, null, ['bypass_shell' => true]);
        if (! is_resource($process)) {
            return [
                'timed_out' => false,
                'stdout' => '',
                'stderr' => 'Failed to start judge process.',
                'exit_code' => 1,
            ];
        }

        if ($input !== null && $input !== '') {
            fwrite($pipes[0], $input);
        }
        fclose($pipes[0]);

        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $stdout = '';
        $stderr = '';
        $exitCode = null;
        $deadline = microtime(true) + max(1, $timeoutSeconds);

        while (true) {
            $status = proc_get_status($process);

            if (! ($status['running'] ?? false)) {
                $exitCode = $status['exitcode'] ?? null;
                break;
            }

            if (microtime(true) >= $deadline) {
                $this->terminateProcOpenProcess($process, (int) ($status['pid'] ?? 0));
                $settleDeadline = microtime(true) + 1;
                do {
                    usleep(10_000);
                    $status = proc_get_status($process);
                } while (($status['running'] ?? false) && microtime(true) < $settleDeadline);

                $stdout .= stream_get_contents($pipes[1]);
                $stderr .= stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($process);

                return [
                    'timed_out' => true,
                    'stdout' => $stdout,
                    'stderr' => $stderr,
                    'exit_code' => null,
                ];
            }

            usleep(10_000);
        }

        $stdout .= stream_get_contents($pipes[1]);
        $stderr .= stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);

        return [
            'timed_out' => false,
            'stdout' => $stdout,
            'stderr' => $stderr,
            'exit_code' => $exitCode,
        ];
    }

    /**
     * @param resource $process
     */
    private function terminateProcOpenProcess($process, int $pid): void
    {
        if (proc_terminate($process)) {
            return;
        }

        if (PHP_OS_FAMILY === 'Windows' && $pid > 0) {
            $kill = new Process(['taskkill', '/PID', (string) $pid, '/T', '/F']);
            $kill->setTimeout(5);
            $kill->run();
        }
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
            // Use RecursiveIterator so __pycache__, compiled binaries, and any
            // sub-dirs are fully removed.
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

    /**
     * Detect a g++ executable, or null if no C++ toolchain is available.
     */
    private function detectGpp(): ?string
    {
        $candidates = ['g++', 'c++', 'C:\\msys64\\mingw64\\bin\\g++.exe', 'C:\\MinGW\\bin\\g++.exe'];

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

        return null;
    }
}
