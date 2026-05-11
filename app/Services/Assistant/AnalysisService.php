<?php

namespace App\Services\Assistant;

use App\Events\Assistant\AnalysisCompleted;
use App\Events\Assistant\AnalysisFailed;
use App\Events\Assistant\AnalysisStarted;
use App\Events\Assistant\TranscriptionCompleted;
use App\Events\Assistant\TTSReady;
use App\Jobs\ProcessAnalysisJob;
use App\Models\AssistantMessage;
use App\Services\Assistant\Contracts\AIProvider;
use App\Services\Assistant\Contracts\AIResponse;
use App\Services\Assistant\Contracts\STTProvider;
use App\Services\Assistant\Contracts\TTSProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class AnalysisService
{
    private const USER_VISIBLE_FAILURE = 'تعذر إكمال التحليل حالياً. حاول مرة أخرى.';

    public function __construct(
        private readonly AIProvider $aiProvider,
        private readonly PromptOrchestrator $orchestrator,
        private readonly ?STTProvider $sttProvider = null,
        private readonly ?TTSProvider $ttsProvider = null,
    ) {}

    public function processMessage(AssistantMessage $message): void
    {
        $jobStart = microtime(true);

        try {
            $message->update(['status' => AssistantMessage::STATUS_ANALYZING]);

            $userId = $message->session->user_id;
            broadcast(new AnalysisStarted($userId, $message->session_id, $message->id));

            $transcript = $message->content ?? '';
            $mode = $message->mode ?? 'idea_check';

            if (! $transcript && $message->audio_path && $this->sttProvider) {
                $message->update(['status' => AssistantMessage::STATUS_TRANSCRIBING]);
                $audioFullPath = Storage::disk('local')->path(
                    $this->assertSafeStoragePath($message->audio_path, 'private/assistant-audio/')
                );
                $transcript = $this->sttProvider->transcribe($audioFullPath, $message->session->language ?? 'ar');
                $message->update(['content' => $transcript]);
                broadcast(new TranscriptionCompleted($userId, $message->session_id, $message->id, $transcript));
            }

            if (ProcessAnalysisJob::isCancelledCooperatively($message)) {
                return;
            }

            $message->update(['status' => AssistantMessage::STATUS_ANALYZING]);

            if ($message->frame_path) {
                $framePath = Storage::disk('local')->path(
                    $this->assertSafeStoragePath($message->frame_path, 'private/assistant-frames/')
                );
                if (! file_exists($framePath)) {
                    throw new \RuntimeException('Frame file not found.');
                }
                $response = $this->aiProvider->analyzeScreenshot($framePath, $transcript, $mode);
            } else {
                $response = $this->aiProvider->analyzeText($transcript, $mode);
            }

            $this->saveAssistantResponse($message, $response, $jobStart);

        } catch (\Throwable $e) {
            $userVisibleError = app()->environment('testing')
                ? $e->getMessage()
                : self::USER_VISIBLE_FAILURE;

            Log::error('assistant.analysis.failed', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);

            $message->update([
                'status' => AssistantMessage::STATUS_FAILED,
                'error_message' => $userVisibleError,
                'analysis_duration_ms' => $this->elapsed($jobStart),
            ]);

            $userId = $message->session->user_id;
            broadcast(new AnalysisFailed($userId, $message->session_id, $message->id, $userVisibleError));
        }
    }

    private function saveAssistantResponse(AssistantMessage $userMessage, AIResponse $response, float $jobStart): void
    {
        $assistantMessage = AssistantMessage::create([
            'session_id' => $userMessage->session_id,
            'reply_to_message_id' => $userMessage->id,
            'client_request_id' => (string) Str::uuid(),
            'role' => 'assistant',
            'content' => $response->text,
            'mode' => $userMessage->mode,
            'status' => AssistantMessage::STATUS_COMPLETED,
            'provider_name' => $this->aiProvider->providerName(),
            'provider_model' => $response->model,
            'provider_latency_ms' => $response->latencyMs,
            'analysis_duration_ms' => $this->elapsed($jobStart),
            'token_usage' => $response->tokenUsage,
        ]);

        $userMessage->update([
            'status' => AssistantMessage::STATUS_COMPLETED,
            'provider_name' => $this->aiProvider->providerName(),
            'provider_model' => $response->model,
            'provider_latency_ms' => $response->latencyMs,
            'analysis_duration_ms' => $this->elapsed($jobStart),
            'token_usage' => $response->tokenUsage,
        ]);

        $userId = $userMessage->session->user_id;
        broadcast(new AnalysisCompleted($userId, $userMessage->session_id, $userMessage->id, $response->text));

        Log::info('assistant.analysis.completed', [
            'message_id' => $userMessage->id,
            'assistant_message_id' => $assistantMessage->id,
            'provider' => 'openai',
            'model' => $response->model,
            'latency_ms' => $response->latencyMs,
            'tokens' => $response->tokenUsage,
        ]);

        $this->generateTTS($userMessage, $assistantMessage, $response->text);
    }

    private function generateTTS(AssistantMessage $userMessage, AssistantMessage $assistantMessage, string $text): void
    {
        if (! $this->ttsProvider || empty($text)) {
            return;
        }

        try {
            $userMessage->update(['status' => AssistantMessage::STATUS_TTS_GENERATING]);
            $ttsStart = microtime(true);

            $language = $userMessage->session->language ?? 'ar';
            $ttsPath = $this->ttsProvider->synthesize($text, $language);

            $ttsDuration = $this->elapsed($ttsStart);
            $assistantMessage->update([
                'tts_path' => $ttsPath,
                'tts_duration_ms' => $ttsDuration,
            ]);
            $userMessage->update([
                'status' => AssistantMessage::STATUS_COMPLETED,
                'tts_duration_ms' => $ttsDuration,
            ]);

            $userId = $userMessage->session->user_id;
            $audioUrl = URL::signedRoute('assistant.audio', ['message' => $assistantMessage->id], now()->addHour());
            broadcast(new TTSReady($userId, $userMessage->session_id, $userMessage->id, $audioUrl));

        } catch (\Throwable $e) {
            Log::warning('assistant.tts.failed', [
                'message_id' => $assistantMessage->id,
                'error' => $e->getMessage(),
            ]);
            $userMessage->update(['status' => AssistantMessage::STATUS_COMPLETED]);
        }
    }

    private function elapsed(float $start): int
    {
        return (int) ((microtime(true) - $start) * 1000);
    }

    /**
     * Validate that a DB-stored file path stays within the expected storage prefix.
     * Prevents path traversal if a stored path is ever tampered with.
     */
    private function assertSafeStoragePath(string $relativePath, string $expectedPrefix): string
    {
        $normalised = str_replace('\\', '/', $relativePath);
        if (! str_starts_with($normalised, $expectedPrefix)) {
            throw new \RuntimeException('Unsafe storage path rejected.');
        }

        return $relativePath;
    }
}
