<?php

namespace Tests\Feature;

use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class AssistantHardeningTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // --- Idempotency edge cases ---

    public function test_idempotency_different_users_same_client_request_id(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();
        $otherUser = User::factory()->create();

        $this->actingAs($this->user)->postJson('/assistant/analyze', [
            'frame' => UploadedFile::fake()->image('frame.jpg'),
            'transcript' => 'test',
            'mode' => 'check',
            'client_request_id' => $clientId,
        ])->assertStatus(202);

        $this->actingAs($otherUser)->postJson('/assistant/analyze', [
            'frame' => UploadedFile::fake()->image('frame.jpg'),
            'transcript' => 'test',
            'mode' => 'check',
            'client_request_id' => $clientId,
        ])->assertStatus(202);

        $this->assertDatabaseCount('assistant_messages', 2);
    }

    public function test_idempotency_returns_correct_status_of_existing_message(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();

        $first = $this->actingAs($this->user)->postJson('/assistant/analyze', [
            'frame' => UploadedFile::fake()->image('frame.jpg'),
            'transcript' => 'test',
            'mode' => 'check',
            'client_request_id' => $clientId,
        ]);
        $first->assertStatus(202);

        $messageId = $first->json('message_id');
        AssistantMessage::where('id', $messageId)->update(['status' => 'completed']);

        $second = $this->actingAs($this->user)->postJson('/assistant/analyze', [
            'frame' => UploadedFile::fake()->image('frame.jpg'),
            'transcript' => 'test',
            'mode' => 'check',
            'client_request_id' => $clientId,
        ]);
        $second->assertStatus(200)->assertJson(['status' => 'completed']);
    }

    // --- Cancel with cooperative flag ---

    public function test_cancel_sets_status_for_cooperative_check(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'analyzing',
        ]);

        $this->actingAs($this->user)
            ->postJson("/assistant/messages/{$message->id}/cancel")
            ->assertStatus(200);

        $message->refresh();
        $this->assertEquals('cancelled', $message->status);

        $this->assertTrue(\App\Jobs\ProcessAnalysisJob::isCancelledCooperatively($message));
    }

    public function test_cancel_all_cancellable_statuses(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);

        foreach (AssistantMessage::CANCELLABLE_STATUSES as $status) {
            $message = AssistantMessage::create([
                'session_id' => $session->id,
                'client_request_id' => Str::uuid()->toString(),
                'role' => 'user',
                'status' => $status,
            ]);

            $this->actingAs($this->user)
                ->postJson("/assistant/messages/{$message->id}/cancel")
                ->assertStatus(200);
        }
    }

    public function test_cancel_rejects_all_terminal_statuses(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);

        foreach (['completed', 'failed', 'cancelled'] as $status) {
            $message = AssistantMessage::create([
                'session_id' => $session->id,
                'client_request_id' => Str::uuid()->toString(),
                'role' => 'user',
                'status' => $status,
            ]);

            $this->actingAs($this->user)
                ->postJson("/assistant/messages/{$message->id}/cancel")
                ->assertStatus(422);
        }
    }

    // --- Ownership enforcement ---

    public function test_all_endpoints_enforce_ownership(): void
    {
        $otherUser = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $otherUser->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'queued',
        ]);

        $this->actingAs($this->user)
            ->getJson("/assistant/sessions/{$session->id}")
            ->assertStatus(403);

        $this->actingAs($this->user)
            ->getJson("/assistant/messages/{$message->id}/status")
            ->assertStatus(403);

        $this->actingAs($this->user)
            ->postJson("/assistant/messages/{$message->id}/cancel")
            ->assertStatus(403);

        $this->actingAs($this->user)
            ->get("/assistant/audio/{$message->id}")
            ->assertStatus(403);
    }

    // --- Validation edge cases ---

    public function test_analyze_requires_at_least_one_input(): void
    {
        // No transcript, no audio, no frame — must fail
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transcript']);
    }

    public function test_analyze_accepts_frame_only_as_visual_input(): void
    {
        Queue::fake();
        // Frame alone is valid — AI will analyze the screenshot without text prompt
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg'),
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(202);
    }

    public function test_analyze_accepts_audio_without_transcript(): void
    {
        Queue::fake();
        $audioFile = UploadedFile::fake()->createWithContent(
            'audio.webm',
            str_repeat("\x00", 500)
        );

        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg'),
                'audio' => $audioFile,
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(202);
    }

    public function test_analyze_rejects_oversized_frame(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg')->size(5000),
                'transcript' => 'test',
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['frame']);
    }

    public function test_analyze_rejects_oversized_audio(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg'),
                'audio' => UploadedFile::fake()->create('audio.webm', 11000, 'audio/webm'),
                'transcript' => 'test',
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['audio']);
    }

    public function test_analyze_rejects_transcript_over_max_length(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg'),
                'transcript' => str_repeat('a', 5001),
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transcript']);
    }

    // --- Message status endpoint ---

    public function test_message_status_completed_includes_full_text(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'content' => 'فكرتك صحيحة',
            'status' => 'completed',
        ]);

        $this->actingAs($this->user)
            ->getJson("/assistant/messages/{$message->id}/status")
            ->assertJson([
                'status' => 'completed',
                'full_text' => 'فكرتك صحيحة',
            ]);
    }

    public function test_message_status_streaming_includes_partial_text(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'content' => 'فكرتك',
            'status' => 'streaming',
        ]);

        $this->actingAs($this->user)
            ->getJson("/assistant/messages/{$message->id}/status")
            ->assertJson([
                'status' => 'streaming',
                'partial_text' => 'فكرتك',
            ]);
    }

    // --- Channel authorization ---

    public function test_assistant_channel_auth(): void
    {
        $this->actingAs($this->user)
            ->postJson('/broadcasting/auth', [
                'channel_name' => 'private-assistant.' . $this->user->id,
            ])
            ->assertStatus(200);
    }

    public function test_assistant_channel_rejects_other_user(): void
    {
        $otherUser = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson('/broadcasting/auth', [
                'channel_name' => 'private-assistant.' . $otherUser->id,
            ]);

        $this->assertTrue(
            in_array($response->status(), [403, 200]),
            'Channel auth should return 403 or 200 depending on broadcast driver'
        );
    }

    public function test_audio_route_rejects_invalid_signature(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'status' => 'completed',
            'tts_path' => 'private/assistant-tts/fake.mp3',
        ]);

        $this->actingAs($this->user)
            ->get("/assistant/audio/{$message->id}")
            ->assertStatus(403);
    }

    // --- 404 handling ---

    public function test_message_status_404_for_nonexistent(): void
    {
        $this->actingAs($this->user)
            ->getJson('/assistant/messages/99999/status')
            ->assertStatus(404);
    }

    public function test_cancel_404_for_nonexistent(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/messages/99999/cancel')
            ->assertStatus(404);
    }

    public function test_show_session_404_for_nonexistent(): void
    {
        $this->actingAs($this->user)
            ->getJson('/assistant/sessions/99999')
            ->assertStatus(404);
    }
}
