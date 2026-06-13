<?php

namespace App\Exceptions;

class AIProviderConfigurationException extends \RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $provider,
        public readonly string $failureCategory = 'configuration_missing',
    ) {
        parent::__construct($message);
    }
}
