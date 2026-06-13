<?php

namespace Tests\Feature;

use App\Jobs\ProcessAnalysisJob;
use App\Models\User;
use App\Services\Assistant\AnalysisService;
use App\Services\Assistant\Contracts\AIProvider;
use App\Services\Assistant\Contracts\AIResponse;
use App\Services\Assistant\Contracts\TTSProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class AssistantCompletionFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_analyze_job_and_status_endpoint_return_assistant_reply_and_audio(): void
    {
        Queue::fake();
        config(['broadcasting.default' => 'log']);

        $this->app->instance(AIProvider::class, new class implements AIProvider {
            public function providerName(): string
            {
                return 'fake';
            }

            public function analyzeScreenshot(string $imagePath, string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse
            {
                return new AIResponse(
                    text: 'فكرتك جيدة، لكن راجع الحالة الحدية الأخيرة.',
                    tokenUsage: ['prompt_tokens' => 10, 'completion_tokens' => 8, 'total_tokens' => 18],
                    model: 'fake-model',
                    latencyMs: 12,
                );
            }

            public function analyzeText(string $userPrompt, string $mode, string $responseLanguage = 'ar'): AIResponse
            {
                return new AIResponse(
                    text: 'استلمت رسالتك النصية.',
                    tokenUsage: ['prompt_tokens' => 5, 'completion_tokens' => 4, 'total_tokens' => 9],
                    model: 'fake-model',
                    latencyMs: 8,
                );
            }

            public function supportsStreaming(): bool
            {
                return false;
            }

            public function analyzeScreenshotStreamed(string $imagePath, string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse
            {
                return $this->analyzeScreenshot($imagePath, $userPrompt, $mode, $responseLanguage);
            }

            public function analyzeTextStreamed(string $userPrompt, string $mode, callable $onChunk, string $responseLanguage = 'ar'): AIResponse
            {
                return $this->analyzeText($userPrompt, $mode, $responseLanguage);
            }
        });

        $this->app->instance(TTSProvider::class, new class implements TTSProvider {
            public function synthesize(string $text, string $language): string
            {
                $path = 'private/assistant-tts/test-reply.mp3';
                $fullPath = storage_path('app/'.$path);
                if (! is_dir(dirname($fullPath))) {
                    mkdir(dirname($fullPath), 0777, true);
                }
                file_put_contents($fullPath, 'fake-mp3');

                return $path;
            }
        });

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/assistant/analyze', [
            'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
            'transcript' => 'أعتقد أن الحل Binary Search',
            'mode' => 'check',
            'language' => 'ar',
            'client_request_id' => Str::uuid()->toString(),
        ]);

        $response->assertStatus(202);
        $messageId = $response->json('message_id');

        $job = new ProcessAnalysisJob($messageId);
        $job->handle(app(AnalysisService::class));

        $this->actingAs($user)
            ->getJson("/assistant/messages/{$messageId}/status")
            ->assertStatus(200)
            ->assertJson([
                'status' => 'completed',
                'full_text' => 'فكرتك جيدة، لكن راجع الحالة الحدية الأخيرة.',
                'audio_ready' => true,
            ])
            ->assertJsonPath('audio_url', fn ($value) => is_string($value) && str_contains($value, '/assistant/audio/'));
    }
}
