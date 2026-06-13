<?php

return [
    'usage' => [
        'assistant_daily_limit' => (int) env('AI_USAGE_ASSISTANT_DAILY_LIMIT', 100),
        'codeforces_daily_limit' => (int) env('AI_USAGE_CODEFORCES_DAILY_LIMIT', 20),
    ],

    'stale_job_minutes' => (int) env('AI_STALE_JOB_MINUTES', 15),
];
