<?php

namespace App\Console\Commands;

use App\Models\AssistantMessage;
use App\Models\CodeforcesSolution;
use App\Services\AI\AiUsageService;
use Illuminate\Console\Command;

class MarkStaleAiJobs extends Command
{
    protected $signature = 'ai:mark-stale-jobs';

    protected $description = 'Mark stale assistant and Codeforces AI jobs as failed.';

    public function handle(AiUsageService $usage): int
    {
        $cutoff = now()->subMinutes((int) config('ai.stale_job_minutes', 15));

        $assistantStatuses = [
            AssistantMessage::STATUS_QUEUED,
            AssistantMessage::STATUS_TRANSCRIBING,
            AssistantMessage::STATUS_ANALYZING,
            AssistantMessage::STATUS_STREAMING,
            AssistantMessage::STATUS_TTS_GENERATING,
        ];

        $assistantMessages = AssistantMessage::query()
            ->where('role', 'user')
            ->whereIn('status', $assistantStatuses)
            ->where('updated_at', '<', $cutoff)
            ->with('session:id,user_id')
            ->get();

        foreach ($assistantMessages as $message) {
            $message->update([
                'status' => AssistantMessage::STATUS_FAILED,
                'error_message' => 'تعذر إكمال التحليل حالياً. حاول مرة أخرى.',
            ]);

            $usage->record(
                $message->session?->user_id,
                AiUsageService::FEATURE_ASSISTANT_ANALYSIS,
                'failed',
                $message->provider_name,
                $message->provider_model,
                $message->analysis_duration_ms,
                $message->token_usage,
                'stale_job',
            );
        }

        $solutions = CodeforcesSolution::query()
            ->whereIn('status', [CodeforcesSolution::STATUS_PENDING, CodeforcesSolution::STATUS_PROCESSING])
            ->where('updated_at', '<', $cutoff)
            ->get();

        foreach ($solutions as $solution) {
            $solution->update([
                'status' => CodeforcesSolution::STATUS_FAILED,
                'progress_stage' => CodeforcesSolution::STAGE_FAILED,
                'error_message' => 'تعذر إكمال العملية. حاول مرة أخرى.',
            ]);

            [$provider, $model] = $this->codeforcesProviderSnapshot();

            $usage->record(
                $solution->user_id,
                AiUsageService::FEATURE_CODEFORCES_SOLVE,
                'failed',
                $provider,
                $model,
                null,
                null,
                'stale_job',
            );
        }

        $this->info("Marked {$assistantMessages->count()} assistant messages and {$solutions->count()} Codeforces solutions as stale.");

        return self::SUCCESS;
    }

    /**
     * Match PrimaryTextGenerator provider selection without making a network call.
     *
     * @return array{0: string, 1: string}
     */
    private function codeforcesProviderSnapshot(): array
    {
        $primary = strtolower((string) config('services.ai.primary', 'openai'));
        if ($primary === 'openai' && (string) config('services.ai.openai.api_key', '') !== '') {
            return ['openai', (string) config('services.ai.openai.model', 'gpt-4o')];
        }

        return ['ollama', (string) config('services.ollama.model')];
    }
}
