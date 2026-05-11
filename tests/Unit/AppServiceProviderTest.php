<?php

namespace Tests\Unit;

use App\Models\AlgorithmSession;
use App\Models\CodeforcesSolution;
use App\Models\Submission;
use App\Models\AssistantSession;
use App\Modules\Problems\Models\Problem;
use App\Policies\AlgorithmSessionPolicy;
use App\Policies\AssistantSessionPolicy;
use App\Policies\CodeforcesSolutionPolicy;
use App\Policies\SubmissionPolicy;
use App\Modules\Problems\Policies\ProblemPolicy;
use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_register_runs_without_error(): void
    {
        $provider = new AppServiceProvider($this->app);
        $provider->register();
        $this->assertTrue(true);
    }

    public function test_boot_runs_without_error(): void
    {
        $provider = new AppServiceProvider($this->app);
        $provider->register();
        $provider->boot();
        $this->assertTrue(true);
    }

    // SEC-02: all five policies must be explicitly registered.
    // Gate::getPolicyFor() returns an instantiated policy object, so we check with instanceof.

    public function test_algorithm_session_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(AlgorithmSession::class);
        $this->assertInstanceOf(AlgorithmSessionPolicy::class, $policy);
    }

    public function test_codeforces_solution_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(CodeforcesSolution::class);
        $this->assertInstanceOf(CodeforcesSolutionPolicy::class, $policy);
    }

    public function test_submission_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(Submission::class);
        $this->assertInstanceOf(SubmissionPolicy::class, $policy);
    }

    public function test_assistant_session_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(AssistantSession::class);
        $this->assertInstanceOf(AssistantSessionPolicy::class, $policy);
    }

    public function test_problem_policy_is_registered(): void
    {
        $policy = Gate::getPolicyFor(Problem::class);
        $this->assertInstanceOf(ProblemPolicy::class, $policy);
    }
}
