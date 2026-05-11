<?php

namespace App\Events\Assistant;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AIChunkReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $sessionId,
        public readonly int $messageId,
        public readonly string $chunk,
        public readonly int $chunkIndex,
        public readonly string $status = 'streaming',
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("assistant.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'analysis.chunk';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'message_id' => $this->messageId,
            'chunk' => $this->chunk,
            'chunk_index' => $this->chunkIndex,
            'status' => $this->status,
        ];
    }
}
