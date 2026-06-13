<?php

namespace App\Services\Assistant\Contracts;

class AIResponse
{
    public function __construct(
        public readonly string $text,
        public readonly ?array $tokenUsage = null,
        public readonly ?string $model = null,
        public readonly ?int $latencyMs = null,
    ) {}
}

interface AIProvider
{
    public function providerName(): string;

    public function analyzeScreenshot(string $imagePath, string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse;

    /** Text-only analysis when no visual context is available. */
    public function analyzeText(string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse;

    public function supportsStreaming(): bool;

    /**
     * @param  callable(string $chunk, int $index): void  $onChunk
     */
    public function analyzeScreenshotStreamed(string $imagePath, string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse;

    /**
     * @param  callable(string $chunk, int $index): void  $onChunk
     */
    public function analyzeTextStreamed(string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse;
}
