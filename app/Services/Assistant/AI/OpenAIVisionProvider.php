<?php

namespace App\Services\Assistant\AI;

use App\Exceptions\AIProviderConfigurationException;
use App\Services\Assistant\Contracts\AIProvider;
use App\Services\Assistant\Contracts\AIResponse;
use App\Services\Assistant\PromptOrchestrator;
use App\Services\Assistant\Support\SafeProviderLogContext;
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

    public function analyzeScreenshot(string $imagePath, string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse
    {
        $this->assertReady();
        $this->assertReadableFile($imagePath);

        $start = microtime(true);

        $imageBytes = file_get_contents($imagePath);
        if ($imageBytes === false || $imageBytes === '') {
            throw new \RuntimeException('OpenAI Vision input image is empty or unreadable.');
        }

        $imageData = base64_encode($imageBytes);
        $mimeType = mime_content_type($imagePath) ?: 'image/jpeg';

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode, $responseLanguage);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $response = Http::timeout($this->timeout)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_completion_tokens' => $this->maxTokens,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$imageData}",
                                    'detail' => 'high',
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
            Log::error('openai.vision.failed', SafeProviderLogContext::fromResponse($this->providerName(), $response));
            throw new \RuntimeException('OpenAI Vision request failed: ' . $response->status());
        }

        $data = $response->json();
        $text = $data['choices'][0]['message']['content'] ?? '';
        $usage = $data['usage'] ?? null;
        $this->assertNonEmptyText($text, 'OpenAI Vision response did not include assistant text.');

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

    public function analyzeText(string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse
    {
        $this->assertReady();

        $start = microtime(true);

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode, $responseLanguage);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $response = Http::timeout($this->timeout)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_completion_tokens' => $this->maxTokens,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $formattedUserPrompt],
                ],
            ]);

        $latencyMs = (int) ((microtime(true) - $start) * 1000);

        if (! $response->successful()) {
            Log::error('openai.text.failed', SafeProviderLogContext::fromResponse($this->providerName(), $response));
            throw new \RuntimeException('OpenAI text request failed: ' . $response->status());
        }

        $data = $response->json();
        $text = $data['choices'][0]['message']['content'] ?? '';
        $usage = $data['usage'] ?? null;
        $this->assertNonEmptyText($text, 'OpenAI text response did not include assistant text.');

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
        return true;
    }

    public function analyzeScreenshotStreamed(string $imagePath, string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse
    {
        $this->assertReady();
        $this->assertReadableFile($imagePath);

        $start = microtime(true);

        $imageBytes = file_get_contents($imagePath);
        if ($imageBytes === false || $imageBytes === '') {
            throw new \RuntimeException('OpenAI Vision input image is empty or unreadable.');
        }

        $imageData = base64_encode($imageBytes);
        $mimeType = mime_content_type($imagePath) ?: 'image/jpeg';

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode, $responseLanguage);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => "data:{$mimeType};base64,{$imageData}",
                            'detail' => 'high',
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => $formattedUserPrompt,
                    ],
                ],
            ],
        ];

        return $this->streamChatCompletion($messages, $onChunk, $start);
    }

    public function analyzeTextStreamed(string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse
    {
        $this->assertReady();

        $start = microtime(true);

        $systemPrompt = $this->orchestrator->buildSystemPrompt($mode, $responseLanguage);
        $formattedUserPrompt = $this->orchestrator->buildUserPrompt($userPrompt, $mode);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $formattedUserPrompt],
        ];

        return $this->streamChatCompletion($messages, $onChunk, $start);
    }

    private function streamChatCompletion(array $messages, callable $onChunk, float $start): AIResponse
    {
        $response = Http::withOptions(['stream' => true])
            ->timeout($this->timeout)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_completion_tokens' => $this->maxTokens,
                'stream' => true,
                'messages' => $messages,
            ]);

        if (! $response->successful()) {
            Log::error('openai.stream.failed', SafeProviderLogContext::fromResponse($this->providerName(), $response));
            throw new \RuntimeException('OpenAI streaming request failed: ' . $response->status());
        }

        $body = $response->getBody();
        $lineBuffer = '';
        $rawIndex = 0;
        $fullText = '';
        $modelName = $this->model;
        $done = false;

        while (! $body->eof() && ! $done) {
            $lineBuffer .= $body->read(4096);

            while (! $done && ($pos = strpos($lineBuffer, "\n")) !== false) {
                $line = rtrim(substr($lineBuffer, 0, $pos), "\r");
                $lineBuffer = substr($lineBuffer, $pos + 1);

                if (! str_starts_with($line, 'data: ')) {
                    continue;
                }

                $data = substr($line, 6);

                if ($data === '[DONE]') {
                    $done = true;
                    break;
                }

                $json = json_decode($data, true);
                if ($json === null) {
                    continue;
                }

                if (isset($json['model'])) {
                    $modelName = $json['model'];
                }

                $content = $json['choices'][0]['delta']['content'] ?? null;
                if ($content !== null && $content !== '') {
                    $fullText .= $content;
                    $onChunk($content, $rawIndex++);
                }
            }
        }

        $latencyMs = (int) ((microtime(true) - $start) * 1000);
        $this->assertNonEmptyText($fullText, 'OpenAI streaming response produced no text.');

        return new AIResponse(
            text: $fullText,
            tokenUsage: null,
            model: $modelName,
            latencyMs: $latencyMs,
        );
    }

    private function assertReady(): void
    {
        if ($this->apiKey === '') {
            throw new AIProviderConfigurationException('OpenAI API key is not configured.', $this->providerName());
        }
    }

    private function assertReadableFile(string $path): void
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw new \RuntimeException('OpenAI Vision input image is not readable.');
        }
    }

    private function assertNonEmptyText(mixed $text, string $message): void
    {
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException($message);
        }
    }
}
