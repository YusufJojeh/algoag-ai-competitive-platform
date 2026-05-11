<?php

namespace Tests\Feature;

use App\Modules\Execution\Contracts\CodeJudge;
use App\Modules\Execution\Judges\LocalProcessJudge;
use App\Modules\Execution\Judges\StubCodeJudge;
use Tests\TestCase;

/**
 * Regression tests for the production guard on the real code judge.
 *
 * Policy: in production, if JUDGE_USE_REAL=true, the binding MUST throw
 * unless either (a) JUDGE_SANDBOX_DRIVER is set, or (b) JUDGE_ALLOW_UNSANDBOXED_IN_PROD=true.
 *
 * The bind is lazy: the exception only fires when something resolves CodeJudge,
 * so an unrelated request that never touches the judge will not crash.
 */
class JudgeProductionGuardTest extends TestCase
{
    /**
     * Re-flush the singleton so each test gets a fresh resolution
     * after we mutate config() and the env.
     */
    private function freshJudge(): CodeJudge
    {
        $this->app->forgetInstance(CodeJudge::class);

        return $this->app->make(CodeJudge::class);
    }

    public function test_production_with_use_real_and_no_sandbox_throws(): void
    {
        $this->app['env'] = 'production';
        config([
            'judge.use_real_judge' => true,
            'judge.sandbox_driver' => null,
            'judge.allow_unsandboxed_in_production' => false,
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('JUDGE_USE_REAL=true is disallowed in production without a sandbox');

        $this->freshJudge();
    }

    public function test_production_with_sandbox_driver_resolves(): void
    {
        $this->app['env'] = 'production';
        config([
            'judge.use_real_judge' => true,
            'judge.sandbox_driver' => 'docker',
            'judge.allow_unsandboxed_in_production' => false,
        ]);

        $judge = $this->freshJudge();
        $this->assertInstanceOf(LocalProcessJudge::class, $judge);
    }

    public function test_production_with_explicit_unsandboxed_override_resolves(): void
    {
        $this->app['env'] = 'production';
        config([
            'judge.use_real_judge' => true,
            'judge.sandbox_driver' => null,
            'judge.allow_unsandboxed_in_production' => true,
        ]);

        $judge = $this->freshJudge();
        $this->assertInstanceOf(LocalProcessJudge::class, $judge);
    }

    public function test_local_env_with_use_real_no_sandbox_resolves(): void
    {
        $this->app['env'] = 'local';
        config([
            'judge.use_real_judge' => true,
            'judge.sandbox_driver' => null,
            'judge.allow_unsandboxed_in_production' => false,
        ]);

        $judge = $this->freshJudge();
        $this->assertInstanceOf(LocalProcessJudge::class, $judge);
    }

    public function test_use_real_false_always_resolves_to_stub(): void
    {
        $this->app['env'] = 'production';
        config([
            'judge.use_real_judge' => false,
        ]);

        $judge = $this->freshJudge();
        $this->assertInstanceOf(StubCodeJudge::class, $judge);
    }

    public function test_default_config_resolves_to_stub(): void
    {
        // No config overrides — the default JUDGE_USE_REAL=false must apply.
        $this->app->forgetInstance(CodeJudge::class);

        // Reset config to its defaults by re-reading the file.
        config([
            'judge.use_real_judge' => filter_var(env('JUDGE_USE_REAL', false), FILTER_VALIDATE_BOOLEAN),
        ]);

        $judge = $this->app->make(CodeJudge::class);
        $this->assertInstanceOf(StubCodeJudge::class, $judge);
    }
}
