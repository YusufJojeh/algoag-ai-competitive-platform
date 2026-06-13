<?php

namespace App\Services\AI;

/**
 * Provider-agnostic text completion. Implemented by {@see OpenAITextGenerator}
 * (primary) and {@see \App\Services\OllamaService} (fallback) and resolved
 * through {@see PrimaryTextGenerator}. Keeping the surface to a single method
 * means any existing {@see \App\Services\OllamaService} mock already satisfies
 * this contract, so consumers can depend on the interface without breaking.
 */
interface TextGenerator
{
    /**
     * Generate a non-streaming completion for the given prompt.
     *
     * @param  int  $timeout  Per-request timeout in seconds.
     */
    public function generate(string $prompt, int $timeout = 120): string;
}
