<?php

namespace App\Services\Assistant\Support;

use Illuminate\Http\Client\Response;

class SafeProviderLogContext
{
    public static function fromResponse(string $provider, Response $response, array $extra = []): array
    {
        return array_filter([
            'provider' => $provider,
            'status' => $response->status(),
            'request_id' => $response->header('x-request-id') ?: $response->header('openai-request-id'),
            ...$extra,
        ], fn ($value) => $value !== null && $value !== '');
    }
}
