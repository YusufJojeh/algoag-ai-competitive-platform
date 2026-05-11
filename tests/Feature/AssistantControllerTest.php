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

class AssistantControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // --- Index ---

    public function test_assistant_page_requires_auth(): void
    {
        $this->get('/assistant')->assertRedirect('/login');
    }

    public function test_assistant_page_renders_for_authenticated_user(): void
    {
        $this->actingAs($this->user)
            ->get('/assistant')
            ->assertStatus(200);
    }

    // --- Analyze ---

    public function test_analyze_requires_auth(): void
    {
        $this->postJson('/assistant/analyze', [])->assertUnauthorized();
    }

    public function test_analyze_validates_required_fields(): void
    {
        // frame is optional; transcript is required_without_all:audio,frame
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transcript', 'mode', 'client_request_id']);
    }

    public function test_analyze_validates_frame_must_be_image(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
                'transcript' => 'test',
                'mode' => 'check',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['frame']);
    }

    public function test_analyze_validates_mode_enum(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript' => 'test',
                'mode' => 'invalid_mode',
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['mode']);
    }

    public function test_analyze_validates_client_request_id_is_uuid(): void
    {
        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript' => 'test',
                'mode' => 'check',
                'client_request_id' => 'not-a-uuid',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['client_request_id']);
    }

    public function test_analyze_creates_session_and_message(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();

        $response = $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript' => 'أعتقد أن الحل يحتاج Binary Search',
                'mode' => 'check',
                'language' => 'ar',
                'client_request_id' => $clientId,
            ]);

        $response->assertStatus(202)
            ->assertJsonStructure(['session_id', 'message_id', 'status', 'client_request_id'])
            ->assertJson(['status' => 'queued', 'client_request_id' => $clientId]);

        $this->assertDatabaseHas('assistant_sessions', [
            'user_id' => $this->user->id,
            'language' => 'ar',
        ]);

        // COR-03: stored ID is now UUID-format (8-4-4-4-12) derived from md5 of user+clientId.
        $hash = md5($this->user->id.'|'.$clientId);
        $expectedScopedId = sprintf('%s-%s-%s-%s-%s',
            substr($hash, 0, 8), substr($hash, 8, 4),
            substr($hash, 12, 4), substr($hash, 16, 4),
            substr($hash, 20, 12)
        );
        // 'check' is a legacy alias normalised to 'idea_check' before storage.
        $this->assertDatabaseHas('assistant_messages', [
            'client_request_id' => $expectedScopedId,
            'role' => 'user',
            'mode' => 'idea_check',
            'status' => 'queued',
        ]);
    }

    public function test_analyze_idempotency_returns_existing_on_duplicate(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();
        $payload = [
            'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
            'transcript' => 'test idea',
            'mode' => 'hint',
            'client_request_id' => $clientId,
        ];

        $first = $this->actingAs($this->user)->postJson('/assistant/analyze', $payload);
        $first->assertStatus(202);
        $firstMessageId = $first->json('message_id');

        $payload['frame'] = UploadedFile::fake()->image('frame2.jpg', 640, 480);
        $second = $this->actingAs($this->user)->postJson('/assistant/analyze', $payload);
        $second->assertStatus(200);
        $this->assertEquals($firstMessageId, $second->json('message_id'));
    }

    public function test_analyze_rejects_other_users_session(): void
    {
        $otherUser = User::factory()->create();
        $session = AssistantSession::create([
            'user_id' => $otherUser->id,
            'language' => 'ar',
        ]);

        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript' => 'test',
                'mode' => 'check',
                'session_id' => $session->id,
                'client_request_id' => Str::uuid()->toString(),
            ])
            ->assertStatus(403);
    }

    public function test_analyze_resumes_existing_session(): void
    {
        Queue::fake();
        $session = AssistantSession::create([
            'user_id' => $this->user->id,
            'language' => 'ar',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame' => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript' => 'follow up',
                'mode' => 'hint',
                'session_id' => $session->id,
                'client_request_id' => Str::uuid()->toString(),
            ]);

        $response->assertStatus(202);
        $this->assertEquals($session->id, $response->json('session_id'));
    }

    // --- Message Status ---

    public function test_message_status_returns_correct_shape(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'content' => 'test',
            'status' => 'queued',
        ]);

        $this->actingAs($this->user)
            ->getJson("/assistant/messages/{$message->id}/status")
            ->assertStatus(200)
            ->assertJsonStructure(['status', 'partial_text', 'full_text', 'audio_ready', 'audio_url', 'error'])
            ->assertJson(['status' => 'queued', 'audio_ready' => false]);
    }

    public function test_message_status_rejects_other_user(): void
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
            ->getJson("/assistant/messages/{$message->id}/status")
            ->assertStatus(403);
    }

    // --- Cancel ---

    public function test_cancel_message_succeeds_for_cancellable_status(): void
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
            ->assertStatus(200)
            ->assertJson(['status' => 'cancelled']);

        $this->assertDatabaseHas('assistant_messages', [
            'id' => $message->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cancel_rejects_completed_message(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'status' => 'completed',
            'content' => 'done',
        ]);

        $this->actingAs($this->user)
            ->postJson("/assistant/messages/{$message->id}/cancel")
            ->assertStatus(422);
    }

    public function test_cancel_rejects_other_user(): void
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
            ->postJson("/assistant/messages/{$message->id}/cancel")
            ->assertStatus(403);
    }

    // --- Sessions list ---

    public function test_sessions_list_returns_user_sessions(): void
    {
        AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar', 'title' => 'Test']);
        AssistantSession::create(['user_id' => $this->user->id, 'language' => 'en', 'title' => 'Test 2']);

        $otherUser = User::factory()->create();
        AssistantSession::create(['user_id' => $otherUser->id, 'language' => 'ar']);

        $response = $this->actingAs($this->user)
            ->getJson('/assistant/sessions')
            ->assertStatus(200);

        $this->assertCount(2, $response->json('data'));
    }

    // --- Show session ---

    public function test_show_session_returns_with_messages(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'content' => 'test message',
            'status' => 'completed',
        ]);

        $this->actingAs($this->user)
            ->getJson("/assistant/sessions/{$session->id}")
            ->assertStatus(200)
            ->assertJsonPath('id', $session->id);
    }

    public function test_show_session_rejects_other_user(): void
    {
        $otherUser = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $otherUser->id, 'language' => 'ar']);

        $this->actingAs($this->user)
            ->getJson("/assistant/sessions/{$session->id}")
            ->assertStatus(403);
    }

    // --- Audio ---

    public function test_audio_returns_404_when_no_tts_path(): void
    {
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'status' => 'completed',
        ]);

        $url = URL::signedRoute('assistant.audio', ['message' => $message->id]);

        $this->actingAs($this->user)
            ->get($url)
            ->assertStatus(404);
    }

    public function test_audio_rejects_other_user(): void
    {
        $otherUser = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $otherUser->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'assistant',
            'status' => 'completed',
            'tts_path' => 'assistant-tts/fake.mp3',
        ]);

        $url = URL::signedRoute('assistant.audio', ['message' => $message->id]);

        $this->actingAs($this->user)
            ->get($url)
            ->assertStatus(403);
    }

    // COR-03: scopedClientRequestId must produce a UUID-format string (8-4-4-4-12).

    public function test_analyze_stores_uuid_format_scoped_client_request_id(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();

        $this->actingAs($this->user)
            ->postJson('/assistant/analyze', [
                'frame'             => UploadedFile::fake()->image('frame.jpg', 640, 480),
                'transcript'        => 'test scoped id format',
                'mode'              => 'check',
                'client_request_id' => $clientId,
            ])
            ->assertStatus(202);

        $message = AssistantMessage::where('role', 'user')->latest()->first();
        $this->assertNotNull($message);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $message->client_request_id,
            'Scoped client_request_id must be UUID-format, not a raw 32-char MD5 hex'
        );
    }

    public function test_analyze_scoped_id_is_deterministic_for_same_user_and_client_id(): void
    {
        Queue::fake();
        $clientId = Str::uuid()->toString();

        $payload = [
            'frame'             => UploadedFile::fake()->image('f.jpg', 640, 480),
            'transcript'        => 'first',
            'mode'              => 'check',
            'client_request_id' => $clientId,
        ];

        $first = $this->actingAs($this->user)->postJson('/assistant/analyze', $payload);
        $first->assertStatus(202);
        $storedId = AssistantMessage::where('role', 'user')->latest()->first()->client_request_id;

        // Recompute manually to verify determinism.
        $hash = md5($this->user->id.'|'.$clientId);
        $expected = sprintf('%s-%s-%s-%s-%s',
            substr($hash, 0, 8), substr($hash, 8, 4),
            substr($hash, 12, 4), substr($hash, 16, 4),
            substr($hash, 20, 12)
        );

        $this->assertSame($expected, $storedId);
    }

    // COR-04: queue_wait_ms must never be negative regardless of clock skew.

    public function test_process_analysis_job_queue_wait_ms_is_non_negative(): void
    {
        Queue::fake();
        $session = AssistantSession::create(['user_id' => $this->user->id, 'language' => 'ar']);

        $message = AssistantMessage::create([
            'session_id'        => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role'              => 'user',
            'content'           => 'test',
            'mode'              => 'check',
            'status'            => 'queued',
        ]);
        // Back-date the message to simulate a "future" DB timestamp (clock skew).
        $message->forceFill(['created_at' => now()->addMinutes(5)])->save();

        $mockService = $this->createMock(\App\Services\Assistant\AnalysisService::class);
        $mockService->method('processMessage');

        $job = new \App\Jobs\ProcessAnalysisJob($message->id);
        $job->handle($mockService);

        $message->refresh();
        if ($message->queue_wait_ms !== null) {
            $this->assertGreaterThanOrEqual(0, $message->queue_wait_ms,
                'queue_wait_ms must be non-negative even when DB clock is ahead of worker clock');
        }
    }
}
