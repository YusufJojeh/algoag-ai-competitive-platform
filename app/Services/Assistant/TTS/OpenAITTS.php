<?php

namespace App\Services\Assistant\TTS;

use App\Services\Assistant\Contracts\TTSProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OpenAITTS implements TTSProvider
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = (string) config('assistant.openai.api_key');
    }

    public function synthesize(string $text, string $language): string
    {
        $voice = $language === 'ar' ? 'nova' : 'alloy';

        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.openai.com/v1/audio/speech', [
                'model' => 'tts-1',
                'input' => $text,
                'voice' => $voice,
                'response_format' => 'mp3',
            ]);

        if (! $response->successful()) {
            Log::error('openai.tts.failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('OpenAI TTS failed: ' . $response->status());
        }

        $filename = 'private/assistant-tts/' . Str::uuid() . '.mp3';
        Storage::disk('local')->put($filename, $response->body());

        return $filename;
    }
}
