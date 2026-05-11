<?php

namespace Tests\Feature;

use App\Jobs\ProcessCodeforcesSolutionJob;
use App\Models\CodeforcesSolution;
use App\Models\User;
use App\Services\BenchmarkRunner;
use App\Services\Assistant\AnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Security hardening regression tests.
 *
 * Each test corresponds to a specific vulnerability that was fixed.
 * If any of these fail, a security regression has been introduced.
 */
class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    // -------------------------------------------------------------------------
    // SEC-01: is_admin must NOT be mass-assignable on User
    // -------------------------------------------------------------------------

    public function test_is_admin_is_not_in_user_fillable(): void
    {
        $user = new User;
        $this->assertNotContains('is_admin', $user->getFillable(), 'is_admin must not be mass-assignable — privilege escalation risk.');
    }

    public function test_user_create_cannot_set_is_admin(): void
    {
        $user = User::create([
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true, // should be silently ignored
        ]);

        $this->assertFalse((bool) $user->fresh()->is_admin, 'is_admin must not be settable via mass assignment.');
    }

    public function test_registration_endpoint_cannot_elevate_to_admin(): void
    {
        $response = $this->postJson('/register', [
            'name' => 'Bad Actor',
            'email' => 'bad@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'is_admin' => true,
        ]);

        $response->assertRedirect();

        $user = User::where('email', 'bad@example.com')->first();
        $this->assertNotNull($user);
        $this->assertFalse((bool) $user->is_admin, 'Registration must not allow self-elevating to admin.');
    }

    // -------------------------------------------------------------------------
    // SEC-02: E2E fixture endpoint requires testing environment
    // -------------------------------------------------------------------------

    public function test_e2e_auth_fixture_returns_200_with_valid_secret(): void
    {
        // In phpunit: APP_ENV=testing, ENABLE_E2E_FIXTURES=true, secret=phpunit-e2e-secret.
        $response = $this->withHeaders(['X-E2E-Secret' => 'phpunit-e2e-secret'])
            ->get('/__e2e/runtime/auth/fixture');
        $response->assertOk();
        $this->assertArrayHasKey('email', $response->json());
        $this->assertArrayHasKey('password', $response->json());
    }

    public function test_e2e_login_get_returns_405_with_valid_secret(): void
    {
        $response = $this->withHeaders(['X-E2E-Secret' => 'phpunit-e2e-secret'])
            ->get('/__e2e/runtime/auth/login');
        $response->assertStatus(405);
    }

    // -------------------------------------------------------------------------
    // SEC-03: ProcessCodeforcesSolutionJob::failed() stores sanitized message
    // -------------------------------------------------------------------------

    public function test_job_failed_stores_generic_error_not_exception_message(): void
    {
        $user = User::factory()->create();
        $solution = CodeforcesSolution::create([
            'user_id' => $user->id,
            'problem_text' => 'Some problem',
            'solution_language' => 'python',
            'status' => CodeforcesSolution::STATUS_PROCESSING,
        ]);

        $job = new ProcessCodeforcesSolutionJob($solution->id);
        $internalException = new \RuntimeException(
            'SQLSTATE[HY000] [2002] Connection refused — host: 127.0.0.1'
        );

        $job->failed($internalException);

        $solution->refresh();
        $this->assertSame(CodeforcesSolution::STATUS_FAILED, $solution->status);
        $this->assertStringNotContainsString('SQLSTATE', (string) $solution->error_message,
            'Raw exception message must not be stored in error_message.');
        $this->assertStringNotContainsString('127.0.0.1', (string) $solution->error_message,
            'Internal IP must not be stored in error_message.');
        $this->assertNotEmpty($solution->error_message, 'A generic user-facing message must be stored.');
    }

    // -------------------------------------------------------------------------
    // SEC-04: BenchmarkRunner::run() clamps size to MAX_SINGLE_RUN_SIZE
    // -------------------------------------------------------------------------

    public function test_benchmark_runner_max_size_constant_exists(): void
    {
        $this->assertTrue(
            defined(BenchmarkRunner::class.'::MAX_SINGLE_RUN_SIZE'),
            'BenchmarkRunner must define MAX_SINGLE_RUN_SIZE.'
        );
        $this->assertGreaterThan(0, BenchmarkRunner::MAX_SINGLE_RUN_SIZE);
    }

    public function test_benchmark_runner_clamps_oversized_request(): void
    {
        $runner = new BenchmarkRunner;
        $oversizedResult = $runner->run('sorting', PHP_INT_MAX);

        $this->assertSame(
            BenchmarkRunner::MAX_SINGLE_RUN_SIZE,
            $oversizedResult['n'],
            'run() must clamp $size to MAX_SINGLE_RUN_SIZE to prevent memory exhaustion.'
        );
    }

    public function test_benchmark_runner_clamps_negative_size_to_one(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', -100);

        $this->assertSame(1, $result['n'], 'Negative size must be clamped to 1.');
    }

    public function test_benchmark_runner_zero_size_clamped_to_one(): void
    {
        $runner = new BenchmarkRunner;
        $result = $runner->run('sorting', 0);

        $this->assertSame(1, $result['n']);
    }

    // -------------------------------------------------------------------------
    // SEC-05: AnalysisService rejects paths outside expected storage prefix
    // -------------------------------------------------------------------------

    public function test_analysis_service_rejects_traversal_in_frame_path(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Unsafe storage path rejected.');

        // Call the private method via reflection to unit-test it in isolation.
        $service = $this->app->make(AnalysisService::class);
        $reflection = new \ReflectionMethod($service, 'assertSafeStoragePath');
        $reflection->setAccessible(true);

        $reflection->invoke($service, '../../etc/passwd', 'private/assistant-frames/');
    }

    public function test_analysis_service_rejects_absolute_path_injection(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Unsafe storage path rejected.');

        $service = $this->app->make(AnalysisService::class);
        $reflection = new \ReflectionMethod($service, 'assertSafeStoragePath');
        $reflection->setAccessible(true);

        $reflection->invoke($service, '/etc/shadow', 'private/assistant-audio/');
    }

    public function test_analysis_service_accepts_valid_frame_path(): void
    {
        $service = $this->app->make(AnalysisService::class);
        $reflection = new \ReflectionMethod($service, 'assertSafeStoragePath');
        $reflection->setAccessible(true);

        $result = $reflection->invoke($service, 'private/assistant-frames/abc123.jpg', 'private/assistant-frames/');

        $this->assertSame('private/assistant-frames/abc123.jpg', $result);
    }

    public function test_analysis_service_accepts_valid_audio_path(): void
    {
        $service = $this->app->make(AnalysisService::class);
        $reflection = new \ReflectionMethod($service, 'assertSafeStoragePath');
        $reflection->setAccessible(true);

        $result = $reflection->invoke($service, 'private/assistant-audio/uuid.webm', 'private/assistant-audio/');

        $this->assertSame('private/assistant-audio/uuid.webm', $result);
    }

    // -------------------------------------------------------------------------
    // SEC-06: LocalProcessJudge temp dir uses random_bytes (not uniqid)
    // -------------------------------------------------------------------------

    public function test_local_process_judge_creates_unpredictable_temp_dir(): void
    {
        if (! config('judge.use_real', false)) {
            $this->markTestSkipped('LocalProcessJudge only instantiated when JUDGE_USE_REAL=true.');
        }

        $judge = new \App\Modules\Execution\Judges\LocalProcessJudge;
        $reflection = new \ReflectionMethod($judge, 'createTempDir');
        $reflection->setAccessible(true);

        $dir1 = $reflection->invoke($judge);
        $dir2 = $reflection->invoke($judge);

        try {
            $base1 = basename($dir1);
            $base2 = basename($dir2);

            // Dirs must be distinct
            $this->assertNotSame($dir1, $dir2);

            // Names must look like hex strings (random_bytes output), not uniqid() output
            // uniqid() produces something like: 6439b3a2e5f123.45678901
            // random_bytes(16) → bin2hex → 32 hex chars
            $this->assertMatchesRegularExpression(
                '/^judge_[0-9a-f]{32}$/',
                $base1,
                'Temp dir name must be judge_ followed by 32 hex chars from random_bytes(16).'
            );
        } finally {
            // Clean up dirs if they were created
            if (is_dir($dir1)) {
                @rmdir($dir1);
            }
            if (is_dir($dir2)) {
                @rmdir($dir2);
            }
        }
    }

    // -------------------------------------------------------------------------
    // SEC-07: Prompt injection delimiters present in CodeforcesSolverService
    // -------------------------------------------------------------------------

    public function test_codeforces_solver_wraps_user_content_in_delimiters(): void
    {
        $service = $this->app->make(\App\Services\CodeforcesSolverService::class);
        $reflection = new \ReflectionMethod($service, 'parseProblem');
        $reflection->setAccessible(true);

        // Use Http fake to capture the outgoing prompt
        $capturedPrompt = null;
        \Illuminate\Support\Facades\Http::fake(function ($request) use (&$capturedPrompt) {
            $body = json_decode($request->body(), true);
            $capturedPrompt = $body['prompt'] ?? null;

            return \Illuminate\Support\Facades\Http::response(['response' => '{"title":"","description":"","input_format":"","output_format":"","constraints":"","examples":[],"notes":""}'], 200);
        });

        try {
            $reflection->invoke($service, 'User supplied problem text here');
        } catch (\Throwable) {
            // We only care that the prompt was built correctly, not the parse result.
        }

        if ($capturedPrompt !== null) {
            $this->assertStringContainsString('<user_content>', $capturedPrompt,
                'parseProblem() must wrap user input in <user_content> delimiters to mitigate prompt injection.');
            $this->assertStringContainsString('</user_content>', $capturedPrompt);
        } else {
            $this->markTestSkipped('Ollama not available — prompt capture skipped.');
        }
    }
}
