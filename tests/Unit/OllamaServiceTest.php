<?php

namespace Tests\Unit;

use App\Services\OllamaService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class OllamaServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ollama.url' => 'http://localhost:11434']);
        config(['services.ollama.model' => 'llama3.2']);
    }

    public function test_is_available_returns_true_when_ollama_responds_ok(): void
    {
        Http::fake(['http://localhost:11434/api/tags' => Http::response([], 200)]);

        $service = new OllamaService;
        $this->assertTrue($service->isAvailable());
    }

    public function test_is_available_returns_false_when_ollama_fails(): void
    {
        Http::fake(['http://localhost:11434/api/tags' => Http::response(null, 500)]);

        $service = new OllamaService;
        $this->assertFalse($service->isAvailable());
    }

    public function test_is_available_returns_false_on_exception(): void
    {
        Http::fake(fn () => throw new \Exception('Connection refused'));

        Log::shouldReceive('warning')->once();

        $service = new OllamaService;
        $this->assertFalse($service->isAvailable());
    }

    public function test_generate_returns_response_text(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response([
                'response' => 'Hello from Ollama',
            ], 200),
        ]);

        $service = new OllamaService;
        $result = $service->generate('Say hello');

        $this->assertSame('Hello from Ollama', $result);
    }

    public function test_generate_throws_on_failed_request(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response('Error', 500),
        ]);

        $service = new OllamaService;

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Ollama request failed');

        $service->generate('Say hello');
    }

    public function test_suggest_algorithms_parses_json_array(): void
    {
        $json = '[{"name":"Binary Search","complexity_time":"O(log n)","complexity_space":"O(1)","description":"Fits.","when_best":"Sorted.","benchmark_key":"binary_search"}]';
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => $json], 200),
        ]);

        $service = new OllamaService;
        $result = $service->suggestAlgorithms('Find in sorted array');

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertSame('Binary Search', $result[0]['name']);
        $this->assertSame('binary_search', $result[0]['benchmark_key']);
    }

    public function test_suggest_algorithms_strips_markdown_code_block(): void
    {
        $withMarkdown = "```json\n[{\"name\":\"Sort\",\"complexity_time\":\"O(n log n)\",\"complexity_space\":\"O(1)\",\"description\":\"x\",\"when_best\":\"y\",\"benchmark_key\":\"sorting\"}]\n```";
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => $withMarkdown], 200),
        ]);

        $service = new OllamaService;
        $result = $service->suggestAlgorithms('Sort array');

        $this->assertIsArray($result);
        $this->assertSame('Sort', $result[0]['name']);
    }

    public function test_suggest_algorithms_returns_fallback_when_invalid_json(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => 'not json at all'], 200),
        ]);

        $service = new OllamaService;
        $result = $service->suggestAlgorithms('Some problem');

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertSame('General approach', $result[0]['name']);
        $this->assertSame('sorting', $result[0]['benchmark_key']);
    }

    public function test_recommend_returns_generated_text(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response([
                'response' => 'Choose binary search for best performance.',
            ], 200),
        ]);

        $service = new OllamaService;
        $result = $service->recommend(
            [['name' => 'Binary Search']],
            ['binary_search' => ['time_ms' => 1, 'memory_mb' => 0.1]]
        );

        $this->assertSame('Choose binary search for best performance.', $result);
    }

    public function test_generate_returns_empty_string_when_response_key_missing(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response([], 200),
        ]);

        $service = new OllamaService;
        $result = $service->generate('Say hello');

        $this->assertSame('', $result);
    }

    public function test_suggest_algorithms_returns_fallback_for_empty_response(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => ''], 200),
        ]);

        $service = new OllamaService;
        $result = $service->suggestAlgorithms('Problem');

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertSame('No suggestion parsed.', $result[0]['description']);
    }

    public function test_suggest_algorithms_returns_fallback_for_whitespace_only_response(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => '   '], 200),
        ]);

        $service = new OllamaService;
        $result = $service->suggestAlgorithms('Problem');

        $this->assertIsArray($result);
        $this->assertSame('General approach', $result[0]['name']);
    }

    public function test_constructor_uses_config_url_and_model(): void
    {
        config(['services.ollama.url' => 'http://custom:11434']);
        config(['services.ollama.model' => 'custom-model']);

        Http::fake([
            'http://custom:11434/api/tags' => Http::response([], 200),
            'http://custom:11434/api/generate' => Http::response(['response' => 'ok'], 200),
        ]);

        $service = new OllamaService;
        $this->assertTrue($service->isAvailable());
        $this->assertSame('ok', $service->generate('hi'));
    }

    public function test_recommend_with_empty_arrays(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => 'No data.'], 200),
        ]);

        $service = new OllamaService;
        $result = $service->recommend([], []);

        $this->assertSame('No data.', $result);
    }

    public function test_generate_uses_custom_timeout_single_request(): void
    {
        Http::fake([
            'http://localhost:11434/api/generate' => Http::response(['response' => 'ok'], 200),
        ]);

        $service = new OllamaService;
        $result = $service->generate('Hello', 60);

        $this->assertSame('ok', $result);
        Http::assertSentCount(1);
    }

    public function test_base_url_strips_trailing_slash_from_config(): void
    {
        config(['services.ollama.url' => 'http://localhost:11434/']);

        Http::fake([
            'http://localhost:11434/api/tags' => Http::response([], 200),
        ]);

        $service = new OllamaService;
        $this->assertTrue($service->isAvailable());
    }
}
