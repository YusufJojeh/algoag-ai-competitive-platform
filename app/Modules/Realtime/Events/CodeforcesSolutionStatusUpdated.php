<?php

namespace App\Modules\Realtime\Events;

use App\Modules\Realtime\Support\BroadcastEnvelope;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CodeforcesSolutionStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public int $solutionId,
        public int $userId,
        public string $status,
        public ?string $errorMessage,
        public ?string $correlationId = null,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('codeforces-solutions.'.$this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'solution.status';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return BroadcastEnvelope::wrap('codeforces_solution', $this->solutionId, [
            'solutionId' => $this->solutionId,
            'userId' => $this->userId,
            'status' => $this->status,
            'errorMessage' => $this->errorMessage,
        ], $this->correlationId);
    }
}
