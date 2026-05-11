<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Quadruple gate for /__e2e/runtime/* routes.
 *
 * Returns 404 (not 403) on any failure so external probes cannot distinguish
 * "route exists but I don't have access" from "route does not exist".
 *
 * Required for the route to resolve:
 *   1. app environment is local OR testing
 *   2. config('e2e.enabled') is true (ENABLE_E2E_FIXTURES=true)
 *   3. request has X-E2E-Secret header
 *   4. header value matches config('e2e.fixture_secret') (timing-safe compare)
 */
class EnsureE2EFixturesEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment(['local', 'testing'])) {
            abort(404);
        }

        if (! config('e2e.enabled')) {
            abort(404);
        }

        $expected = (string) config('e2e.fixture_secret');
        if ($expected === '') {
            abort(404);
        }

        $provided = (string) $request->header('X-E2E-Secret', '');
        if (! hash_equals($expected, $provided)) {
            abort(404);
        }

        return $next($request);
    }
}
