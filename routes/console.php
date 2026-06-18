<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('assistant:cleanup')->hourly();
Schedule::command('ai:mark-stale-jobs')->everyFiveMinutes();
Schedule::command('arena:publish-ended-problems')->everyTenMinutes()->withoutOverlapping();
