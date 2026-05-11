<?php

namespace App\Services\Assistant\AI;

use App\Services\Assistant\Contracts\AIProvider;
use App\Services\Assistant\Contracts\AIResponse;
use App\Services\Assistant\PromptOrchestrator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIVisionProvider implements AIProvider
{
    private string $apiKey;
    private string $model;
    private int $maxTokens;
    private int $timeout;

    public function __construct(
        private readonly PromptOrchestrator $orchestrator,
    ) {
        $this->apiKey = (string) config('assistant.openai.api_key');
        $this->model = (string) config('assistant.openai.model', 'gpt-4o-mini');
        $this->maxTokens = (int) config('assistant.openai.max_tokens', 500);
        $this->timeout = (int) config('assistant.openai.timeout', 60);
    }

    public function providerName(): string
    {
        return 'openai';
    }

    public function analyzeScreenshot(string $imagePath, string $userPrompt, string $mode): AIResponse
    {
        $start = microtime(true);

        $imageData = base64_encode(file_get_contents($imagePath));
        $mimeType = mime_content_type($imagePath) ?: 'image/jpeg';

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $response = Http::timeout($this->timeout)
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_tokens' => $this->maxTokens,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$imageData}",
                                    'detail' => 'low',
                                ],
                            ],
                            [
                                'type' => 'text',
                                'text' => $formattedUserPrompt,
                            ],
                        ],
                    ],
                ],
            ]);

        $latencyMs = (int) ((microtime(true) - $start) * 1000);

        if (! $response->successful()) {
            Log::error('openai.vision.failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('OpenAI Vision request failed: ' . $response->status());
        }

        $data = $response->json();
        $text = $data['choices'][0]['message']['content'] ?? '';
        $usage = $data['usage'] ?? null;

        return new AIResponse(
            text: $text,
            tokenUsage: $usage ? [
                'prompt_tokens' => $usage['prompt_tokens'] ?? 0,
                'completion_tokens' => $usage['completion_tokens'] ?? 0,
                'total_tokens' => $usage['total_tokens'] ?? 0,
            ] : null,
            model: $data['model'] ?? $this->model,
            latencyMs: $latencyMs,
        );
    }

    public function analyzeText(string $userPrompt, string $mode): AIResponse
    {
        $start = microtime(true);

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $response = Http::timeout($this->timeout)
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_tokens' => $this->maxTokens,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $formattedUserPrompt],
                ],
            ]);

        $latencyMs = (int) ((microtime(true) - $start) * 1000);

        if (! $response->successful()) {
            Log::error('openai.text.failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('OpenAI text request failed: ' . $response->status());
        }

        $data = $response->json();
        $text = $data['choices'][0]['message']['content'] ?? '';
        $usage = $data['usage'] ?? null;

        return new AIResponse(
            text: $text,
            tokenUsage: $usage ? [
                'prompt_tokens' => $usage['prompt_tokens'] ?? 0,
                'completion_tokens' => $usage['completion_tokens'] ?? 0,
                'total_tokens' => $usage['total_tokens'] ?? 0,
            ] : null,
            model: $data['model'] ?? $this->model,
            latencyMs: $latencyMs,
        );
    }

    public function supportsStreaming(): bool
    {
        return false;
    }

    public function analyzeScreenshotStreamed(string $imagePath, string $userPrompt, string $mode, callable $onChunk): AIResponse
    {
        return $this->analyzeScreenshot($imagePath, $userPrompt, $mode);
    }
}
