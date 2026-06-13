<?php

namespace App\Services\Assistant\TTS;

use App\Exceptions\AIProviderConfigurationException;
use App\Services\Assistant\Contracts\TTSProvider;
use App\Services\Assistant\Support\SafeProviderLogContext;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OpenAITTS implements TTSProvider
{
    private string $apiKey;
    private string $model;
    private int $timeout;
    private string $arabicVoice;
    private string $englishVoice;

    public function __construct()
    {
        $this->apiKey = (string) config('assistant.openai.api_key');
        $this->model = (string) config('assistant.openai.tts_model', 'tts-1');
        $this->timeout = (int) config('assistant.openai.tts_timeout', 30);
        $this->arabicVoice = (string) config('assistant.openai.tts_voice_ar', 'nova');
        $this->englishVoice = (string) config('assistant.openai.tts_voice_en', 'alloy');
    }

    public function synthesize(string $text, string $language): string
    {
        if ($this->apiKey === '') {
            throw new AIProviderConfigurationException('OpenAI API key is not configured.', 'openai');
        }
        $input = trim($text);
        if ($input === '') {
            throw new \InvalidArgumentException('OpenAI TTS input text must not be empty.');
        }

        $voice = $language === 'ar' ? $this->arabicVoice : $this->englishVoice;

        $response = Http::timeout($this->timeout)
            ->accept('audio/mpeg')
            ->asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])
            ->post('https://api.openai.com/v1/audio/speech', [
                'model' => $this->model,
                'input' => $input,
                'voice' => $voice,
                'response_format' => 'mp3',
            ]);

        if (! $response->successful()) {
            Log::error('openai.tts.failed', SafeProviderLogContext::fromResponse('openai', $response));
            throw new \RuntimeException('OpenAI TTS failed: ' . $response->status());
        }

        if ($response->body() === '') {
            throw new \RuntimeException('OpenAI TTS response was empty.');
        }

        $filename = 'private/assistant-tts/' . Str::uuid() . '.mp3';
        Storage::disk('local')->put($filename, $response->body());

        return $filename;
    }
}
