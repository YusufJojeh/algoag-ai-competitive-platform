<?php

namespace Tests\Feature;

use App\Jobs\ProcessAnalysisJob;
use App\Models\AiUsageRecord;
use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Models\CodeforcesSolution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class AiProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_assistant_usage_limit_returns_429(): void
    {
        Queue::fake();
        config(['ai.usage.assistant_daily_limit' => 1]);
        $user = User::factory()->create();

        AiUsageRecord::create([
            'user_id' => $user->id,
            'feature' => 'assistant_analysis',
            'status' => 'completed',
        ]);

        $this->actingAs($user)
            ->postJson('/assistant/analyze', [
                'transcript' => 'test idea',
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(429)
            ->assertJson(['message' => 'AI usage limit reached. Try again later.']);
    }

    public function test_missing_openai_key_marks_assistant_message_failed_safely(): void
    {
        config([
            'assistant.ai_provider' => 'openai',
            'assistant.openai.api_key' => '',
        ]);
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'en']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'content' => 'hello',
            'mode' => 'idea_check',
            'status' => 'queued',
        ]);

        (new ProcessAnalysisJob($message->id))->handle(app(\App\Services\Assistant\AnalysisService::class));

        $message->refresh();
        $this->assertSame('failed', $message->status);
        $this->assertStringNotContainsString('sk-', (string) $message->error_message);
        $this->assertDatabaseHas('ai_usage_records', [
            'user_id' => $user->id,
            'feature' => 'assistant_analysis',
            'status' => 'failed',
            'failure_category' => 'configuration_missing',
        ]);
    }

    public function test_stale_ai_jobs_are_marked_failed(): void
    {
        config([
            'ai.stale_job_minutes' => 1,
            'services.ai.primary' => 'openai',
            'services.ai.openai.api_key' => 'test-key',
            'services.ai.openai.model' => 'gpt-4o',
        ]);
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'queued',
        ]);
        $message->forceFill(['updated_at' => now()->subMinutes(5)])->save();

        $solution = CodeforcesSolution::create([
            'user_id' => $user->id,
            'problem_text' => 'Find max.',
            'status' => CodeforcesSolution::STATUS_PENDING,
            'progress_stage' => CodeforcesSolution::STAGE_QUEUED,
        ]);
        $solution->forceFill(['updated_at' => now()->subMinutes(5)])->save();

        $this->artisan('ai:mark-stale-jobs')->assertSuccessful();

        $this->assertDatabaseHas('assistant_messages', [
            'id' => $message->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('codeforces_solutions', [
            'id' => $solution->id,
            'status' => 'failed',
            'progress_stage' => 'failed',
        ]);
        $this->assertDatabaseHas('ai_usage_records', [
            'user_id' => $user->id,
            'feature' => 'codeforces_solve',
            'provider' => 'openai',
            'model' => 'gpt-4o',
            'status' => 'failed',
            'failure_category' => 'stale_job',
        ]);
    }

    public function test_assistant_accepts_text_audio_frame_and_frame_only_inputs(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        foreach ([
            ['transcript' => 'text only'],
            ['audio' => UploadedFile::fake()->create('audio.mp3', 10, 'audio/mpeg')],
            ['frame' => UploadedFile::fake()->image('frame.jpg')],
            ['transcript' => 'combined', 'frame' => UploadedFile::fake()->image('frame.jpg')],
        ] as $payload) {
            $this->actingAs($user)
                ->postJson('/assistant/analyze', [
                    ...$payload,
                    'mode' => 'check',
                    'client_request_id' => Str::uuid()->toString(),
                ])
                ->assertStatus(202);
        }
    }
}
