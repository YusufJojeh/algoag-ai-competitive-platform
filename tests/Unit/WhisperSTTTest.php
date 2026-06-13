<?php

namespace Tests\Unit;

use App\Services\Assistant\STT\WhisperSTT;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhisperSTTTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'assistant.openai.api_key' => 'test-key',
            'assistant.openai.stt_model' => 'whisper-1',
            'assistant.openai.stt_timeout' => 30,
        ]);
    }

    public function test_transcribe_returns_text(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/transcriptions' => Http::response('أعتقد أن الحل يحتاج Binary Search'),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_');
        file_put_contents($tempFile, 'fake audio data');

        try {
            $stt = new WhisperSTT;
            $result = $stt->transcribe($tempFile, 'ar');

            $this->assertEquals('أعتقد أن الحل يحتاج Binary Search', $result);
        } finally {
            @unlink($tempFile);
        }

        Http::assertSentCount(1);
    }

    public function test_transcribe_sends_current_openai_transcription_payload(): void
    {
        config(['assistant.openai.stt_model' => 'gpt-4o-mini-transcribe']);
        Http::fake([
            'api.openai.com/v1/audio/transcriptions' => Http::response('I think we need binary search'),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_');
        file_put_contents($tempFile, 'fake audio data');

        try {
            (new WhisperSTT)->transcribe($tempFile, 'en-US');
        } finally {
            @unlink($tempFile);
        }

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.openai.com/v1/audio/transcriptions'
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && str_contains($request->body(), 'gpt-4o-mini-transcribe')
                && str_contains($request->body(), 'name="language"')
                && str_contains($request->body(), 'en')
                && str_contains($request->body(), 'name="response_format"')
                && str_contains($request->body(), 'text');
        });
    }

    public function test_transcribe_throws_on_api_error(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/transcriptions' => Http::response('error', 500),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_');
        file_put_contents($tempFile, 'fake audio data');

        try {
            $stt = new WhisperSTT;
            $this->expectException(\RuntimeException::class);
            $stt->transcribe($tempFile, 'ar');
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_transcribe_rejects_empty_file(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_');

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('empty');

            (new WhisperSTT)->transcribe($tempFile, 'en');
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_transcribe_handles_english(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/transcriptions' => Http::response('I think we need binary search'),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_');
        file_put_contents($tempFile, 'fake audio data');

        try {
            $stt = new WhisperSTT;
            $result = $stt->transcribe($tempFile, 'en');

            $this->assertEquals('I think we need binary search', $result);
        } finally {
            @unlink($tempFile);
        }
    }
}
