<?php

namespace Tests\Unit;

use App\Services\Assistant\TTS\OpenAITTS;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OpenAITTSTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'assistant.openai.api_key' => 'test-key',
            'assistant.openai.tts_model' => 'tts-1',
            'assistant.openai.tts_timeout' => 30,
            'assistant.openai.tts_voice_ar' => 'nova',
            'assistant.openai.tts_voice_en' => 'alloy',
        ]);
        Storage::fake('local');
    }

    public function test_synthesize_returns_file_path(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('fake mp3 binary data'),
        ]);

        $tts = new OpenAITTS;
        $path = $tts->synthesize('فكرتك صحيحة', 'ar');

        $this->assertStringStartsWith('private/assistant-tts/', $path);
        $this->assertStringEndsWith('.mp3', $path);
        Storage::disk('local')->assertExists($path);

        Http::assertSentCount(1);
    }

    public function test_synthesize_sends_current_openai_speech_payload(): void
    {
        config([
            'assistant.openai.tts_model' => 'tts-1-hd',
            'assistant.openai.tts_voice_en' => 'shimmer',
        ]);
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('fake mp3 binary data'),
        ]);

        (new OpenAITTS)->synthesize('  Your idea is correct  ', 'en');

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);

            return $request->url() === 'https://api.openai.com/v1/audio/speech'
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && $request->hasHeader('Accept', 'audio/mpeg')
                && $body['model'] === 'tts-1-hd'
                && $body['input'] === 'Your idea is correct'
                && $body['voice'] === 'shimmer'
                && $body['response_format'] === 'mp3';
        });
    }

    public function test_synthesize_throws_on_api_error(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('error', 500),
        ]);

        $tts = new OpenAITTS;
        $this->expectException(\RuntimeException::class);
        $tts->synthesize('test', 'ar');
    }

    public function test_synthesize_rejects_empty_text(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('must not be empty');

        (new OpenAITTS)->synthesize('   ', 'en');
    }

    public function test_synthesize_uses_different_voice_for_english(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('fake mp3'),
        ]);

        $tts = new OpenAITTS;
        $tts->synthesize('Your idea is correct', 'en');

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);

            return $body['voice'] === 'alloy';
        });
    }

    // SEC-05: filename must use a UUID (unpredictable), not uniqid() (microsecond-based).

    public function test_synthesize_filename_is_uuid_format(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('fake mp3'),
        ]);

        $tts = new OpenAITTS;
        $path = $tts->synthesize('test', 'en');

        // Strip directory prefix and extension.
        $basename = basename($path, '.mp3');

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $basename,
            'TTS filename should be a UUID, not a predictable uniqid() string'
        );
    }

    public function test_synthesize_two_calls_produce_distinct_filenames(): void
    {
        Http::fake([
            'api.openai.com/v1/audio/speech' => Http::response('fake mp3'),
        ]);

        $tts = new OpenAITTS;
        $path1 = $tts->synthesize('first', 'en');
        $path2 = $tts->synthesize('second', 'en');

        $this->assertNotSame($path1, $path2);
    }
}
