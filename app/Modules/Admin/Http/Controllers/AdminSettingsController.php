<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => [
                'app' => [
                    'name' => config('app.name'),
                    'env' => config('app.env'),
                    'debug' => (bool) config('app.debug'),
                    'locale' => config('app.locale'),
                    'timezone' => config('app.timezone'),
                ],
                'services' => [
                    [
                        'name' => 'Database',
                        'status' => $this->databaseStatus(),
                        'detail' => config('database.default'),
                    ],
                    [
                        'name' => 'Cache',
                        'status' => $this->cacheStatus(),
                        'detail' => config('cache.default'),
                    ],
                    [
                        'name' => 'Queue',
                        'status' => 'configured',
                        'detail' => config('queue.default'),
                    ],
                    [
                        'name' => 'AI provider',
                        'status' => config('ai.default') ? 'configured' : 'missing',
                        'detail' => config('ai.default') ?? 'No default provider',
                    ],
                    [
                        'name' => 'Assistant provider',
                        'status' => config('assistant.ai.provider') ? 'configured' : 'missing',
                        'detail' => config('assistant.ai.provider') ?? 'No assistant provider',
                    ],
                ],
                'limits' => [
                    'judge_enabled' => (bool) config('judge.enabled', false),
                    'judge_timeout_seconds' => config('judge.timeout_seconds'),
                    'assistant_max_audio_mb' => config('assistant.audio.max_mb'),
                ],
            ],
        ]);
    }

    private function databaseStatus(): string
    {
        try {
            DB::connection()->getPdo();

            return 'online';
        } catch (\Throwable) {
            return 'offline';
        }
    }

    private function cacheStatus(): string
    {
        try {
            Cache::store()->get('admin-health-check');

            return 'online';
        } catch (\Throwable) {
            return 'offline';
        }
    }
}
