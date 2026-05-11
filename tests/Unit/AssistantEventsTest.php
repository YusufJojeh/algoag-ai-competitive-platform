<?php

namespace Tests\Unit;

use App\Events\Assistant\AIChunkReceived;
use App\Events\Assistant\AnalysisCompleted;
use App\Events\Assistant\AnalysisFailed;
use App\Events\Assistant\AnalysisStarted;
use App\Events\Assistant\TranscriptionCompleted;
use App\Events\Assistant\TTSReady;
use Illuminate\Broadcasting\PrivateChannel;
use Tests\TestCase;

class AssistantEventsTest extends TestCase
{
    public function test_analysis_started_broadcasts_on_private_channel(): void
    {
        $event = new AnalysisStarted(userId: 1, sessionId: 10, messageId: 100);

        $channel = $event->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channel);
        $this->assertEquals('analysis.started', $event->broadcastAs());

        $data = $event->broadcastWith();
        $this->assertEquals(10, $data['session_id']);
        $this->assertEquals(100, $data['message_id']);
        $this->assertEquals('analyzing', $data['status']);
    }

    public function test_transcription_completed_includes_transcript(): void
    {
        $event = new TranscriptionCompleted(
            userId: 1, sessionId: 10, messageId: 100, transcript: 'Binary Search'
        );

        $data = $event->broadcastWith();
        $this->assertEquals('Binary Search', $data['transcript']);
        $this->assertEquals('transcription.completed', $event->broadcastAs());
    }

    public function test_ai_chunk_received_includes_chunk_data(): void
    {
        $event = new AIChunkReceived(
            userId: 1, sessionId: 10, messageId: 100, chunk: 'فكرتك', chunkIndex: 0
        );

        $data = $event->broadcastWith();
        $this->assertEquals('فكرتك', $data['chunk']);
        $this->assertEquals(0, $data['chunk_index']);
        $this->assertEquals('streaming', $data['status']);
        $this->assertEquals('analysis.chunk', $event->broadcastAs());
    }

    public function test_analysis_completed_includes_full_text(): void
    {
        $event = new AnalysisCompleted(
            userId: 1, sessionId: 10, messageId: 100, fullText: 'الإجابة الكاملة'
        );

        $data = $event->broadcastWith();
        $this->assertEquals('الإجابة الكاملة', $data['full_text']);
        $this->assertEquals('completed', $data['status']);
        $this->assertEquals('analysis.completed', $event->broadcastAs());
    }

    public function test_analysis_failed_includes_error(): void
    {
        $event = new AnalysisFailed(
            userId: 1, sessionId: 10, messageId: 100, error: 'Provider timeout'
        );

        $data = $event->broadcastWith();
        $this->assertEquals('Provider timeout', $data['error']);
        $this->assertEquals('failed', $data['status']);
        $this->assertEquals('analysis.failed', $event->broadcastAs());
    }

    public function test_tts_ready_includes_audio_url(): void
    {
        $event = new TTSReady(
            userId: 1, sessionId: 10, messageId: 100, audioUrl: '/assistant/audio/100?signature=abc'
        );

        $data = $event->broadcastWith();
        $this->assertStringContainsString('/assistant/audio/100', $data['audio_url']);
        $this->assertEquals('tts.ready', $event->broadcastAs());
    }

    public function test_all_events_broadcast_to_correct_channel(): void
    {
        $events = [
            new AnalysisStarted(42, 1, 1),
            new TranscriptionCompleted(42, 1, 1, 'text'),
            new AIChunkReceived(42, 1, 1, 'chunk', 0),
            new AnalysisCompleted(42, 1, 1, 'full'),
            new AnalysisFailed(42, 1, 1, 'error'),
            new TTSReady(42, 1, 1, '/audio'),
        ];

        foreach ($events as $event) {
            $channel = $event->broadcastOn();
            $this->assertInstanceOf(PrivateChannel::class, $channel);
        }
    }
}
