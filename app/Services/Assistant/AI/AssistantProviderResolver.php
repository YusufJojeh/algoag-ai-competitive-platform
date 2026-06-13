<?php

namespace App\Services\Assistant\AI;

use App\Exceptions\UnsupportedAIProviderException;
use App\Services\Assistant\Contracts\AIProvider;
use Illuminate\Contracts\Container\Container;

class AssistantProviderResolver
{
    public function __construct(private readonly Container $container) {}

    public function resolve(): AIProvider
    {
        $provider = strtolower((string) config('assistant.ai_provider', 'openai'));

        return match ($provider) {
            'openai' => $this->container->make(OpenAIVisionProvider::class),
            'gemini', 'ollama' => throw new UnsupportedAIProviderException($provider),
            default => throw new UnsupportedAIProviderException($provider ?: 'unknown'),
        };
    }
}
