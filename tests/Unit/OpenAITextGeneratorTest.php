<?php

namespace Tests\Unit;

use App\Services\AI\OpenAITextGenerator;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenAITextGeneratorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.ai.openai.api_key' => 'test-key',
            'services.ai.openai.model' => 'gpt-4o',
            'services.ai.openai.max_tokens' => 4000,
            'services.ai.openai.timeout' => 120,
        ]);
    }

    public function test_generate_sends_chat_completion_payload(): void
    {
        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'full solution']],
                ],
            ]),
        ]);

        $result = (new OpenAITextGenerator)->generate('solve this', 45);

        $this->assertSame('full solution', $result);
        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->url() === 'https://api.openai.com/v1/chat/completions'
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && $request->hasHeader('Accept', 'application/json')
                && $body['model'] === 'gpt-4o'
                && $body['max_completion_tokens'] === 4000
                && $body['messages'] === [
                    ['role' => 'user', 'content' => 'solve this'],
                ];
        });
    }

    public function test_generate_rejects_empty_assistant_content(): void
    {
        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => '']],
                ],
            ]),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('assistant text');

        (new OpenAITextGenerator)->generate('solve this');
    }

    public function test_generate_fails_fast_without_api_key(): void
    {
        config(['services.ai.openai.api_key' => '']);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('API key');

        (new OpenAITextGenerator)->generate('solve this');
    }
}
