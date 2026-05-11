<?php

namespace Tests\Unit;

use App\Jobs\ProcessAnalysisJob;
use App\Models\AssistantMessage;
use App\Models\AssistantSession;
use App\Models\User;
use App\Services\Assistant\AnalysisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProcessAnalysisJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_calls_analysis_service(): void
    {
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'content' => 'test',
            'mode' => 'check',
            'status' => 'queued',
        ]);

        $mockService = $this->createMock(AnalysisService::class);
        $mockService->expects($this->once())
            ->method('processMessage')
            ->with($this->callback(fn ($m) => $m->id === $message->id));

        $job = new ProcessAnalysisJob($message->id);
        $job->handle($mockService);
    }

    public function test_job_skips_cancelled_message(): void
    {
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'cancelled',
        ]);

        $mockService = $this->createMock(AnalysisService::class);
        $mockService->expects($this->never())->method('processMessage');

        $job = new ProcessAnalysisJob($message->id);
        $job->handle($mockService);
    }

    public function test_job_skips_missing_message(): void
    {
        $mockService = $this->createMock(AnalysisService::class);
        $mockService->expects($this->never())->method('processMessage');

        $job = new ProcessAnalysisJob(99999);
        $job->handle($mockService);
    }

    public function test_failed_method_updates_message_status(): void
    {
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id' => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role' => 'user',
            'status' => 'analyzing',
        ]);

        $job = new ProcessAnalysisJob($message->id);
        $job->failed(new \RuntimeException('Provider timeout'));

        $message->refresh();
        $this->assertEquals('failed', $message->status);
        $this->assertEquals('تعذر إكمال التحليل حالياً. حاول مرة أخرى.', $message->error_message);
    }

    // COR-04: queue_wait_ms must never be stored as negative (clock-skew protection).

    public function test_queue_wait_ms_is_non_negative_when_message_has_future_timestamp(): void
    {
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id'        => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role'              => 'user',
            'content'           => 'test',
            'mode'              => 'check',
            'status'            => 'queued',
        ]);

        // Simulate a DB clock that is 5 minutes ahead of the worker.
        $message->forceFill(['created_at' => now()->addMinutes(5)])->save();

        $mockService = $this->createMock(\App\Services\Assistant\AnalysisService::class);
        $mockService->method('processMessage');

        $job = new ProcessAnalysisJob($message->id);
        $job->handle($mockService);

        $message->refresh();
        if ($message->queue_wait_ms !== null) {
            $this->assertGreaterThanOrEqual(
                0,
                $message->queue_wait_ms,
                'queue_wait_ms must be non-negative even when DB timestamp is in the future'
            );
        }
    }

    public function test_queue_wait_ms_is_non_negative_for_normal_message(): void
    {
        $user = User::factory()->create();
        $session = AssistantSession::create(['user_id' => $user->id, 'language' => 'ar']);
        $message = AssistantMessage::create([
            'session_id'        => $session->id,
            'client_request_id' => Str::uuid()->toString(),
            'role'              => 'user',
            'content'           => 'test',
            'mode'              => 'check',
            'status'            => 'queued',
        ]);

        $mockService = $this->createMock(\App\Services\Assistant\AnalysisService::class);
        $mockService->method('processMessage');

        $job = new ProcessAnalysisJob($message->id);
        $job->handle($mockService);

        $message->refresh();
        if ($message->queue_wait_ms !== null) {
            $this->assertGreaterThanOrEqual(0, $message->queue_wait_ms);
        }
    }
}
