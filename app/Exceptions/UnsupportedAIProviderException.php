<?php

namespace App\Exceptions;

class UnsupportedAIProviderException extends AIProviderConfigurationException
{
    public function __construct(string $provider)
    {
        parent::__construct(
            "Assistant AI provider [{$provider}] is not implemented. Supported provider: openai.",
            $provider,
            'unsupported_provider',
        );
    }
}
