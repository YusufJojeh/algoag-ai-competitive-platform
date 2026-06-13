<?php

namespace App\Jobs;

use App\Models\AssistantMessage;
use App\Services\AI\AiUsageService;
use App\Services\Assistant\AnalysisService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAnalysisJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const USER_VISIBLE_FAILURE = 'تعذر إكمال التحليل حالياً. حاول مرة أخرى.';

    public int $tries = 2;
    public int $timeout = 300;

    public function __construct(
        public readonly int $messageId,
    ) {}

    public function handle(AnalysisService $service): void
    {
        $message = AssistantMessage::find($this->messageId);

        if (! $message) {
            Log::warning('assistant.job.message_not_found', ['message_id' => $this->messageId]);
            return;
        }

        if ($this->isCancelledCooperatively($message)) {
            Log::info('assistant.job.cancelled_before_start', ['message_id' => $this->messageId]);
            return;
        }

        $queueWait = $message->created_at
            ? abs((int) (now()->diffInMilliseconds($message->created_at)))
            : null;

        if ($queueWait !== null) {
            $message->update(['queue_wait_ms' => $queueWait]);
        }

        $service->processMessage($message);
    }

    public static function isCancelledCooperatively(AssistantMessage $message): bool
    {
        $message->refresh();

        return $message->status === AssistantMessage::STATUS_CANCELLED;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('assistant.job.failed', [
            'message_id' => $this->messageId,
            'failure_category' => 'job_failed',
        ]);

        $message = AssistantMessage::find($this->messageId);
        if ($message && ! $message->isTerminal()) {
            $message->update([
                'status' => AssistantMessage::STATUS_FAILED,
                'error_message' => self::USER_VISIBLE_FAILURE,
            ]);

            app(AiUsageService::class)->record(
                $message->session?->user_id,
                AiUsageService::FEATURE_ASSISTANT_ANALYSIS,
                'failed',
                $message->provider_name,
                $message->provider_model,
                null,
                $message->token_usage,
                'job_failed',
            );
        }
    }
}
