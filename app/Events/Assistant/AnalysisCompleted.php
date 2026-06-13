<?php

namespace App\Events\Assistant;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnalysisCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $sessionId,
        public readonly int $messageId,
        public readonly string $fullText,
        public readonly string $status = 'completed',
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("assistant.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'analysis.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'message_id' => $this->messageId,
            'full_text' => $this->fullText,
            'status' => $this->status,
        ];
    }
}
