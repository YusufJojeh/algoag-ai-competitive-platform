<?php

namespace App\Services\AI;

use App\Services\OllamaService;
use Illuminate\Support\Facades\Log;

/**
 * Routes text generation to the configured primary provider (OpenAI) and falls
 * back to Ollama when OpenAI is unconfigured or a request fails. This keeps
 * "OpenAI as the primary provider" true in production while preserving the
 * existing offline / key-less behaviour.
 */
class PrimaryTextGenerator implements TextGenerator
{
    private ?string $lastProvider = null;

    public function __construct(
        private readonly OpenAITextGenerator $openai,
        private readonly OllamaService $ollama,
    ) {}

    /**
     * The provider that will actually serve the next request — used for
     * accurate usage/telemetry labelling.
     */
    public function activeProvider(): string
    {
        if ($this->lastProvider !== null) {
            return $this->lastProvider;
        }

        $primary = strtolower((string) config('services.ai.primary', 'openai'));

        if ($primary === 'openai' && $this->openai->isConfigured()) {
            return 'openai';
        }

        return 'ollama';
    }

    public function generate(string $prompt, int $timeout = 120): string
    {
        $primary = strtolower((string) config('services.ai.primary', 'openai'));

        if ($this->lastProvider === 'ollama') {
            return $this->ollama->generate($prompt, $timeout);
        }

        if ($primary === 'openai' && $this->openai->isConfigured()) {
            try {
                $this->lastProvider = 'openai';
                return $this->openai->generate($prompt, $timeout);
            } catch (\Throwable $e) {
                // Degrade gracefully to Ollama rather than failing the pipeline.
                Log::warning('ai.primary.fallback', [
                    'from' => 'openai',
                    'to' => 'ollama',
                    'failure_category' => 'provider_failure',
                ]);
            }
        }

        $this->lastProvider = 'ollama';
        return $this->ollama->generate($prompt, $timeout);
    }
}
