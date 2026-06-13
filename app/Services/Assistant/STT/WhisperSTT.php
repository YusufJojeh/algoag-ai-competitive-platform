<?php

namespace App\Services\Assistant\STT;

use App\Exceptions\AIProviderConfigurationException;
use App\Services\Assistant\Contracts\STTProvider;
use App\Services\Assistant\Support\SafeProviderLogContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhisperSTT implements STTProvider
{
    private string $apiKey;
    private string $model;
    private int $timeout;

    public function __construct()
    {
        $this->apiKey = (string) config('assistant.openai.api_key');
        $this->model = (string) config('assistant.openai.stt_model', 'whisper-1');
        $this->timeout = (int) config('assistant.openai.stt_timeout', 30);
    }

    public function transcribe(string $audioPath, string $language): string
    {
        if ($this->apiKey === '') {
            throw new AIProviderConfigurationException('OpenAI API key is not configured.', 'openai');
        }
        if (! is_file($audioPath) || ! is_readable($audioPath)) {
            throw new \RuntimeException('OpenAI transcription input audio is not readable.');
        }

        $audioBytes = file_get_contents($audioPath);
        if ($audioBytes === false || $audioBytes === '') {
            throw new \RuntimeException('OpenAI transcription input audio is empty or unreadable.');
        }

        $langCode = match ($language) {
            'ar', 'ar-SA' => 'ar',
            'en', 'en-US' => 'en',
            default => 'ar',
        };

        $response = Http::timeout($this->timeout)
            ->accept('text/plain')
            ->withHeaders(['Authorization' => "Bearer {$this->apiKey}"])
            ->attach('file', $audioBytes, basename($audioPath))
            ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => $this->model,
                'language' => $langCode,
                'response_format' => 'text',
            ]);

        if (! $response->successful()) {
            Log::error('whisper.stt.failed', SafeProviderLogContext::fromResponse('openai', $response));
            throw new \RuntimeException('Whisper STT failed: ' . $response->status());
        }

        $text = trim($response->body());
        if ($text === '') {
            throw new \RuntimeException('OpenAI transcription response was empty.');
        }

        return $text;
    }
}
