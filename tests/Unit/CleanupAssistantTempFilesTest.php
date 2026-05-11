<?php

namespace Tests\Unit;

use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CleanupAssistantTempFilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_deletes_expired_frame_files(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);

        Storage::disk('local')->put('private/assistant-frames/old.jpg', 'data');

        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'completed',
            'frame_path' => 'private/assistant-frames/old.jpg',
        ]);
        $message->forceFill(['created_at' => now()->subHours(2)])->save();

        $this->artisan('assistant:cleanup')
            ->assertExitCode(0);

        $message->refresh();
        $this->assertNull($message->frame_path);
        Storage::disk('local')->assertMissing('private/assistant-frames/old.jpg');
    }

    public function test_cleanup_preserves_recent_files(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);

        Storage::disk('local')->put('private/assistant-frames/recent.jpg', 'data');

        AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'completed',
            'frame_path' => 'private/assistant-frames/recent.jpg',
            'created_at' => now()->subMinutes(5),
        ]);

        $this->artisan('assistant:cleanup')->assertExitCode(0);

        Storage::disk('local')->assertExists('private/assistant-frames/recent.jpg');
    }

    // PERF-02: after cleanup the DB column must be nulled for ALL expired rows in one pass.

    public function test_cleanup_nulls_column_for_all_expired_messages_in_bulk(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);

        $messages = [];
        foreach (range(1, 5) as $i) {
            Storage::disk('local')->put("private/assistant-frames/old_{$i}.jpg", 'data');
            $msg = AssistantMessage::create([
                'session_id'        => $session->id,
                'client_request_id' => Str::uuid()->toString(),
                'role'              => 'user',
                'status'            => 'completed',
                'frame_path'        => "private/assistant-frames/old_{$i}.jpg",
            ]);
            $msg->forceFill(['created_at' => now()->subHours(2)])->save();
            $messages[] = $msg;
        }

        $this->artisan('assistant:cleanup')->assertExitCode(0);

        foreach ($messages as $msg) {
            $msg->refresh();
            $this->assertNull($msg->frame_path, "frame_path should be nulled for message {$msg->id}");
            Storage::disk('local')->assertMissing("private/assistant-frames/old_{$msg->id}.jpg");
        }
    }

    public function test_cleanup_handles_missing_file_gracefully(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);

        // File referenced in DB but does not exist on disk.
        $msg = AssistantMessage::create([
            'session_id'        => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role'              => 'user',
            'status'            => 'completed',
            'frame_path'        => 'private/assistant-frames/ghost.jpg',
        ]);
        $msg->forceFill(['created_at' => now()->subHours(2)])->save();

        // Must not throw even though the file is missing.
        $this->artisan('assistant:cleanup')->assertExitCode(0);

        $msg->refresh();
        $this->assertNull($msg->frame_path);
    }
}
