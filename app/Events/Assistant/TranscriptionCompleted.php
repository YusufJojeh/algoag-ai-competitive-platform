<?php

namespace App\Events\Assistant;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TranscriptionCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $sessionId,
        public readonly int $messageId,
        public readonly string $transcript,
        public readonly string $status = 'analyzing',
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("assistant.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'transcription.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'message_id' => $this->messageId,
            'transcript' => $this->transcript,
            'status' => $this->status,
        ];
    }
}
