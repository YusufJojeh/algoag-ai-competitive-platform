<?php

namespace App\Modules\Realtime\Support;

use Illuminate\Support\Str;

/**
 * Standard fields for Laravel broadcast payloads (Reverb / Pusher) and analytics correlation.
 */
final class BroadcastEnvelope
{
    public const EVENT_VERSION = 1;

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function wrap(string $entityType, string|int $entityId, array $data, ?string $correlationId = null): array
    {
        return array_merge([
            'eventVersion' => self::EVENT_VERSION,
            'entityType' => $entityType,
            'entityId' => $entityId,
            'occurredAt' => now()->toIso8601String(),
            'correlationId' => $correlationId ?? Str::uuid()->toString(),
        ], $data);
    }
}
