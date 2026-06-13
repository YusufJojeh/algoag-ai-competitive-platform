<?php

namespace App\Services\AI;

use App\Services\Assistant\Support\SafeProviderLogContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OpenAI Chat Completions backed {@see TextGenerator}. Used for the Codeforces
 * solver pipeline and algorithm suggestions. Reads the dedicated `services.ai.openai`
 * config (NOT the assistant block — that caps max_tokens at 500, which would
 * truncate full solutions).
 */
class OpenAITextGenerator implements TextGenerator
{
    private string $apiKey;
    private string $model;
    private int $maxTokens;
    private int $timeout;

    public function __construct()
    {
        $this->apiKey = (string) config('services.ai.openai.api_key', '');
        $this->model = (string) config('services.ai.openai.model', 'gpt-4o');
        $this->maxTokens = (int) config('services.ai.openai.max_tokens', 4000);
        $this->timeout = (int) config('services.ai.openai.timeout', 120);
    }

    /**
     * Whether OpenAI is usable. Lets the resolver skip a doomed HTTP call and
     * fall back to Ollama when no key is configured (the default `.env` state).
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function generate(string $prompt, int $timeout = 120): string
    {
        if (! $this->isConfigured()) {
            throw new \RuntimeException('OpenAI API key is not configured.');
        }

        $response = Http::timeout($timeout > 0 ? $timeout : $this->timeout)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'max_completion_tokens' => $this->maxTokens,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $response->successful()) {
            Log::warning('openai.text.failed', SafeProviderLogContext::fromResponse('openai', $response));

            throw new \RuntimeException('OpenAI text request failed.');
        }

        $data = $response->json();
        $text = $data['choices'][0]['message']['content'] ?? '';

        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('OpenAI text response did not include assistant text.');
        }

        return $text;
    }
}
