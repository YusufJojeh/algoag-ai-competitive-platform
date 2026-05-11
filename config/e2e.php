<?php

/*
 * E2E fixture endpoint protection.
 *
 * The /__e2e/runtime/* routes are dangerous in non-local environments because
 * they create/return credentials and log in admin users. They must be locked
 * behind a triple gate: env + flag + shared-secret header.
 */
return [
    /*
     * Master kill-switch. When false, all /__e2e/runtime/* routes return 404
     * regardless of any header.
     */
    'enabled' => filter_var(env('ENABLE_E2E_FIXTURES', false), FILTER_VALIDATE_BOOLEAN),

    /*
     * Shared secret. Clients must send it in the X-E2E-Secret header.
     * Empty string disables access (header comparison will always fail).
     */
    'fixture_secret' => (string) env('E2E_FIXTURE_SECRET', ''),
];
