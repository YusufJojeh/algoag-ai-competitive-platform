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
        config(['assistant.openai.api_key' => 'test-key']);
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
