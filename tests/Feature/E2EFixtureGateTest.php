<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression tests for the /__e2e/runtime/* fixture gate.
 *
 * Policy: all 4 conditions must hold or the route MUST return 404
 * (intentionally not 403, so the route appears non-existent to outsiders).
 *
 *   1. APP_ENV is local or testing
 *   2. ENABLE_E2E_FIXTURES=true  (config('e2e.enabled'))
 *   3. Request has X-E2E-Secret header
 *   4. Header matches config('e2e.fixture_secret')
 */
class E2EFixtureGateTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    private const VALID_SECRET = 'phpunit-e2e-secret';

    // ---- happy path -----------------------------------------------------

    public function test_returns_200_when_all_conditions_met(): void
    {
        $response = $this->withHeaders(['X-E2E-Secret' => self::VALID_SECRET])
            ->get('/__e2e/runtime/auth/fixture');

        $response->assertOk();
    }

    // ---- condition 1: environment --------------------------------------

    public function test_returns_404_when_environment_is_production(): void
    {
        $this->app['env'] = 'production';

        $response = $this->withHeaders(['X-E2E-Secret' => self::VALID_SECRET])
            ->get('/__e2e/runtime/auth/fixture');

        // In production the route is not even registered, so 404.
        $response->assertStatus(404);
    }

    // ---- condition 2: enabled flag -------------------------------------

    public function test_returns_404_when_flag_disabled(): void
    {
        config(['e2e.enabled' => false]);

        $response = $this->withHeaders(['X-E2E-Secret' => self::VALID_SECRET])
            ->get('/__e2e/runtime/auth/fixture');

        $response->assertStatus(404);
    }

    // ---- condition 3: header presence ----------------------------------

    public function test_returns_404_when_header_missing(): void
    {
        $response = $this->get('/__e2e/runtime/auth/fixture');

        $response->assertStatus(404);
    }

    // ---- condition 4: header value -------------------------------------

    public function test_returns_404_when_header_value_wrong(): void
    {
        $response = $this->withHeaders(['X-E2E-Secret' => 'attacker-guess'])
            ->get('/__e2e/runtime/auth/fixture');

        $response->assertStatus(404);
    }

    public function test_returns_404_when_secret_empty(): void
    {
        config(['e2e.fixture_secret' => '']);

        // Even with a matching empty header the gate must reject.
        $response = $this->withHeaders(['X-E2E-Secret' => ''])
            ->get('/__e2e/runtime/auth/fixture');

        $response->assertStatus(404);
    }

    // ---- login endpoint follows same policy ----------------------------

    public function test_login_endpoint_returns_404_without_secret(): void
    {
        $response = $this->post('/__e2e/runtime/auth/login');

        $response->assertStatus(404);
    }
}
