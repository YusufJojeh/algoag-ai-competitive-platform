<?php

namespace App\Services\Assistant\STT;

use App\Services\Assistant\Contracts\STTProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhisperSTT implements STTProvider
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = (string) config('assistant.openai.api_key');
    }

    public function transcribe(string $audioPath, string $language): string
    {
        $langCode = match ($language) {
            'ar', 'ar-SA' => 'ar',
            'en', 'en-US' => 'en',
            default => 'ar',
        };

        $response = Http::timeout(30)
            ->withHeaders(['Authorization' => "Bearer {$this->apiKey}"])
            ->attach('file', file_get_contents($audioPath), basename($audioPath))
            ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => 'whisper-1',
                'language' => $langCode,
                'response_format' => 'text',
            ]);

        if (! $response->successful()) {
            Log::error('whisper.stt.failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Whisper STT failed: ' . $response->status());
        }

        return trim($response->body());
    }
}
