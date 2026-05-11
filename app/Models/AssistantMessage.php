<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssistantMessage extends Model
{
    public const STATUS_QUEUED = 'queued';
    public const STATUS_TRANSCRIBING = 'transcribing';
    public const STATUS_ANALYZING = 'analyzing';
    public const STATUS_STREAMING = 'streaming';
    public const STATUS_TTS_GENERATING = 'tts_generating';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_QUEUED,
        self::STATUS_TRANSCRIBING,
        self::STATUS_ANALYZING,
        self::STATUS_STREAMING,
        self::STATUS_TTS_GENERATING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
    ];

    public const CANCELLABLE_STATUSES = [
        self::STATUS_QUEUED,
        self::STATUS_TRANSCRIBING,
        self::STATUS_ANALYZING,
        self::STATUS_STREAMING,
    ];

    protected $fillable = [
        'session_id',
        'reply_to_message_id',
        'client_request_id',
        'role',
        'content',
        'mode',
        'frame_path',
        'frame_hash',
        'audio_path',
        'tts_path',
        'status',
        'error_message',
        'provider_name',
        'provider_model',
        'provider_latency_ms',
        'queue_wait_ms',
        'analysis_duration_ms',
        'tts_duration_ms',
        'token_usage',
        'is_websocket_fallback',
    ];

    protected function casts(): array
    {
        return [
            'token_usage' => 'array',
            'is_websocket_fallback' => 'boolean',
            'provider_latency_ms' => 'integer',
            'queue_wait_ms' => 'integer',
            'analysis_duration_ms' => 'integer',
            'tts_duration_ms' => 'integer',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AssistantSession::class, 'session_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_message_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'reply_to_message_id');
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, self::CANCELLABLE_STATUSES, true);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED], true);
    }
}
