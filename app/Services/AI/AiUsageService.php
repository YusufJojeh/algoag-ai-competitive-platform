<?php

namespace App\Services\AI;

use App\Models\AiUsageRecord;
use App\Models\User;
use Illuminate\Support\Carbon;

class AiUsageService
{
    public const FEATURE_ASSISTANT_ANALYSIS = 'assistant_analysis';
    public const FEATURE_CODEFORCES_SOLVE = 'codeforces_solve';
    public const FEATURE_ALGORITHM_SUGGEST = 'algorithm_suggest';
    public const FEATURE_ALGORITHM_BENCHMARK = 'algorithm_benchmark';

    public function assertWithinLimit(User $user, string $feature): void
    {
        $limit = $this->dailyLimit($feature);
        if ($limit <= 0) {
            return;
        }

        $count = AiUsageRecord::query()
            ->where('user_id', $user->id)
            ->where('feature', $feature)
            ->where('created_at', '>=', Carbon::now()->startOfDay())
            ->count();

        if ($count >= $limit) {
            throw new \RuntimeException('AI usage limit reached.');
        }
    }

    public function record(
        ?int $userId,
        string $feature,
        string $status,
        ?string $provider = null,
        ?string $model = null,
        ?int $durationMs = null,
        ?array $tokenUsage = null,
        ?string $failureCategory = null,
    ): AiUsageRecord {
        return AiUsageRecord::create([
            'user_id' => $userId,
            'feature' => $feature,
            'provider' => $provider,
            'model' => $model,
            'status' => $status,
            'duration_ms' => $durationMs,
            'token_usage' => $tokenUsage,
            'failure_category' => $failureCategory,
        ]);
    }

    private function dailyLimit(string $feature): int
    {
        return match ($feature) {
            self::FEATURE_ASSISTANT_ANALYSIS => (int) config('ai.usage.assistant_daily_limit', 100),
            self::FEATURE_CODEFORCES_SOLVE => (int) config('ai.usage.codeforces_daily_limit', 20),
            default => 0,
        };
    }
}
