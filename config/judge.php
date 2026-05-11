<?php

return [
    /*
     | Enable the real local Python process judge.
     | DEFAULT IS FALSE FOR SAFETY. The real judge executes AI-generated code
     | without isolation. Only enable on dev machines, or in production behind
     | a sandbox driver (see below).
     */
    'use_real_judge' => filter_var(env('JUDGE_USE_REAL', false), FILTER_VALIDATE_BOOLEAN),

    /*
     | Seconds allowed per test case before the process is killed (TLE).
     */
    'time_limit_seconds' => (int) env('JUDGE_TIME_LIMIT_SECONDS', 10),

    /*
     | Sandbox driver used to isolate the Python process.
     | Supported values (when implemented): docker, gvisor, firejail.
     | If null, the judge runs unsandboxed and is BLOCKED in production
     | unless 'allow_unsandboxed_in_production' is explicitly true.
     */
    'sandbox_driver' => env('JUDGE_SANDBOX_DRIVER'),

    /*
     | Explicit escape hatch acknowledging the RCE risk of running the real
     | judge without a sandbox driver in production. Default false — must be
     | set to true with intent to bypass the production guard.
     */
    'allow_unsandboxed_in_production' => filter_var(
        env('JUDGE_ALLOW_UNSANDBOXED_IN_PROD', false),
        FILTER_VALIDATE_BOOLEAN,
    ),
];
