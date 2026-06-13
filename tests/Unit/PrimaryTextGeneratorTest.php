<?php

namespace Tests\Unit;

use App\Services\AI\OpenAITextGenerator;
use App\Services\AI\PrimaryTextGenerator;
use App\Services\OllamaService;
use Tests\TestCase;

class PrimaryTextGeneratorTest extends TestCase
{
    public function test_active_provider_tracks_ollama_after_openai_fallback(): void
    {
        config(['services.ai.primary' => 'openai']);

        $openai = $this->createMock(OpenAITextGenerator::class);
        $openai->method('isConfigured')->willReturn(true);
        $openai->expects($this->once())
            ->method('generate')
            ->willThrowException(new \RuntimeException('OpenAI failed.'));

        $ollama = $this->createMock(OllamaService::class);
        $ollama->expects($this->exactly(2))
            ->method('generate')
            ->willReturnOnConsecutiveCalls('fallback text', 'fallback text again');

        $generator = new PrimaryTextGenerator($openai, $ollama);

        $this->assertSame('openai', $generator->activeProvider());
        $this->assertSame('fallback text', $generator->generate('prompt'));
        $this->assertSame('ollama', $generator->activeProvider());
        $this->assertSame('fallback text again', $generator->generate('second prompt'));
    }
}
