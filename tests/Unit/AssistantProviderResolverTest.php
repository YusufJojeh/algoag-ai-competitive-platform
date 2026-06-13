<?php

namespace Tests\Unit;

use App\Exceptions\UnsupportedAIProviderException;
use App\Services\Assistant\AI\AssistantProviderResolver;
use App\Services\Assistant\AI\OpenAIVisionProvider;
use App\Services\Assistant\Contracts\AIProvider;
use Tests\TestCase;

class AssistantProviderResolverTest extends TestCase
{
    public function test_resolves_openai_provider(): void
    {
        config(['assistant.ai_provider' => 'openai']);

        $provider = app(AssistantProviderResolver::class)->resolve();

        $this->assertInstanceOf(OpenAIVisionProvider::class, $provider);
        $this->assertInstanceOf(AIProvider::class, $provider);
    }

    public function test_rejects_gemini_until_implemented(): void
    {
        config(['assistant.ai_provider' => 'gemini']);

        $this->expectException(UnsupportedAIProviderException::class);

        app(AssistantProviderResolver::class)->resolve();
    }

    public function test_rejects_ollama_until_implemented(): void
    {
        config(['assistant.ai_provider' => 'ollama']);

        $this->expectException(UnsupportedAIProviderException::class);

        app(AssistantProviderResolver::class)->resolve();
    }
}
