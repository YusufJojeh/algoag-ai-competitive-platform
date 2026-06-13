<?php

namespace Tests\Unit;

use App\Services\Assistant\AI\OpenAIVisionProvider;
use App\Services\Assistant\Contracts\AIResponse;
use App\Services\Assistant\PromptOrchestrator;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenAIVisionProviderTest extends TestCase
{
    private OpenAIVisionProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'assistant.openai.api_key' => 'test-key',
            'assistant.openai.model' => 'gpt-4o-mini',
            'assistant.openai.max_tokens' => 500,
            'assistant.openai.timeout' => 10,
        ]);
        $this->provider = new OpenAIVisionProvider(new PromptOrchestrator);
    }

    public function test_analyze_screenshot_returns_ai_response(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'فكرتك صحيحة. Binary Search مناسب هنا.']],
                ],
                'usage' => [
                    'prompt_tokens' => 100,
                    'completion_tokens' => 20,
                    'total_tokens' => 120,
                ],
                'model' => 'gpt-4o-mini',
            ]),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_frame_');
        file_put_contents($tempFile, $this->createMinimalJpeg());

        try {
            $response = $this->provider->analyzeScreenshot($tempFile, 'Binary Search', 'check');

            $this->assertInstanceOf(AIResponse::class, $response);
            $this->assertStringContainsString('فكرتك صحيحة', $response->text);
            $this->assertEquals('gpt-4o-mini', $response->model);
            $this->assertNotNull($response->tokenUsage);
            $this->assertEquals(120, $response->tokenUsage['total_tokens']);
            $this->assertNotNull($response->latencyMs);
        } finally {
            @unlink($tempFile);
        }

        Http::assertSent(function ($request) {
            $body = $request->data();
            $content = $body['messages'][1]['content'];

            return $request->url() === 'https://api.openai.com/v1/chat/completions'
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && $request->hasHeader('Accept', 'application/json')
                && $body['model'] === 'gpt-4o-mini'
                && $body['max_completion_tokens'] === 500
                && $body['messages'][0]['role'] === 'system'
                && $content[0]['type'] === 'image_url'
                && str_starts_with($content[0]['image_url']['url'], 'data:image/')
                && $content[0]['image_url']['detail'] === 'high'
                && $content[1]['type'] === 'text';
        });
    }

    public function test_analyze_screenshot_throws_on_api_error(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => 'rate limited'], 429),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_frame_');
        file_put_contents($tempFile, $this->createMinimalJpeg());

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('429');
            $this->provider->analyzeScreenshot($tempFile, 'test', 'check');
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_analyze_text_throws_when_openai_returns_empty_content(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => '']],
                ],
                'model' => 'gpt-4o-mini',
            ]),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('assistant text');

        $this->provider->analyzeText('test', 'check', 'en');
    }

    public function test_supports_streaming_returns_true(): void
    {
        $this->assertTrue($this->provider->supportsStreaming());
    }

    public function test_analyze_screenshot_streamed_parses_sse_chunks(): void
    {
        $sseBody = implode("\n", [
            'data: ' . json_encode(['model' => 'gpt-4o-mini', 'choices' => [['index' => 0, 'delta' => ['content' => 'ans'], 'finish_reason' => null]]]),
            '',
            'data: ' . json_encode(['model' => 'gpt-4o-mini', 'choices' => [['index' => 0, 'delta' => ['content' => 'wer'], 'finish_reason' => null]]]),
            '',
            'data: [DONE]',
            '',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response($sseBody, 200, ['Content-Type' => 'text/event-stream']),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_frame_');
        file_put_contents($tempFile, $this->createMinimalJpeg());

        try {
            $chunks = [];
            $response = $this->provider->analyzeScreenshotStreamed(
                $tempFile,
                'test',
                'check',
                function (string $chunk, int $index) use (&$chunks) { $chunks[$index] = $chunk; }
            );

            $this->assertInstanceOf(AIResponse::class, $response);
            $this->assertSame('answer', $response->text);
            $this->assertSame('gpt-4o-mini', $response->model);
            $this->assertCount(2, $chunks);
            $this->assertSame('ans', $chunks[0]);
            $this->assertSame('wer', $chunks[1]);
        } finally {
            @unlink($tempFile);
        }

        Http::assertSent(function ($request) {
            $body = $request->data();
            return $body['stream'] === true;
        });
    }

    public function test_analyze_text_streamed_parses_sse_chunks(): void
    {
        $sseBody = implode("\n", [
            'data: ' . json_encode(['model' => 'gpt-4o-mini', 'choices' => [['index' => 0, 'delta' => ['content' => 'hello'], 'finish_reason' => null]]]),
            '',
            'data: [DONE]',
            '',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response($sseBody, 200, ['Content-Type' => 'text/event-stream']),
        ]);

        $chunks = [];
        $response = $this->provider->analyzeTextStreamed(
            'what is binary search?',
            'check',
            function (string $chunk, int $index) use (&$chunks) { $chunks[$index] = $chunk; }
        );

        $this->assertInstanceOf(AIResponse::class, $response);
        $this->assertSame('hello', $response->text);
        $this->assertNull($response->tokenUsage);
        $this->assertCount(1, $chunks);
    }

    public function test_analyze_screenshot_streamed_throws_on_api_error(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => 'unauthorized'], 401),
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_frame_');
        file_put_contents($tempFile, $this->createMinimalJpeg());

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('401');
            $this->provider->analyzeScreenshotStreamed($tempFile, 'test', 'check', fn () => null);
        } finally {
            @unlink($tempFile);
        }
    }

    // COR-05: providerName() must return the actual provider identifier.
    public function test_provider_name_returns_openai(): void
    {
        $this->assertSame('openai', $this->provider->providerName());
    }

    private function createMinimalJpeg(): string
    {
        $im = imagecreatetruecolor(10, 10);
        ob_start();
        imagejpeg($im);
        $data = ob_get_clean();
        imagedestroy($im);

        return $data;
    }
}
