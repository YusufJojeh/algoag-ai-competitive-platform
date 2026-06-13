<?php

namespace App\Services\AI;

class QueueSafetyService
{
    public function driver(): string
    {
        return (string) config('queue.default', env('QUEUE_CONNECTION', 'sync'));
    }

    public function isLongRunningQueueUnsafe(): bool
    {
        return $this->driver() === 'sync' && ! app()->environment('testing');
    }

    public function assertLongRunningQueueSafe(): void
    {
        if ($this->isLongRunningQueueUnsafe()) {
            throw new \RuntimeException('AI queue is configured as sync. Set QUEUE_CONNECTION=database and run php artisan queue:work.');
        }
    }

    public function report(): array
    {
        return [
            'driver' => $this->driver(),
            'long_running_safe' => ! $this->isLongRunningQueueUnsafe(),
            'stale_job_minutes' => (int) config('ai.stale_job_minutes', 15),
        ];
    }
}
