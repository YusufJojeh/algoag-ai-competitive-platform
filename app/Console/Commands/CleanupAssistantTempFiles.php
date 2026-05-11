<?php

namespace App\Console\Commands;

use App\Models\AssistantMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupAssistantTempFiles extends Command
{
    protected $signature = 'assistant:cleanup';
    protected $description = 'Clean up expired temporary assistant files (frames, audio, TTS)';

    public function handle(): int
    {
        $framesMinutes = (int) config('assistant.retention.frames_minutes', 60);
        $audioMinutes = (int) config('assistant.retention.audio_minutes', 60);
        $ttsHours = (int) config('assistant.retention.tts_hours', 24);

        $framesDeleted = $this->cleanupPaths('frame_path', $framesMinutes);
        $audioDeleted = $this->cleanupPaths('audio_path', $audioMinutes);
        $ttsDeleted = $this->cleanupPaths('tts_path', $ttsHours * 60);

        $this->info("Cleaned up: {$framesDeleted} frames, {$audioDeleted} audio, {$ttsDeleted} TTS files.");

        return self::SUCCESS;
    }

    private function cleanupPaths(string $column, int $minutes): int
    {
        $count = 0;
        $cutoff = now()->subMinutes($minutes);

        AssistantMessage::whereNotNull($column)
            ->where('created_at', '<', $cutoff)
            ->select(['id', $column])
            ->each(function ($message) use ($column, &$count) {
                $path = $message->{$column};
                if ($path && Storage::disk('local')->exists($path)) {
                    Storage::disk('local')->delete($path);
                    $count++;
                }
            });

        AssistantMessage::whereNotNull($column)
            ->where('created_at', '<', $cutoff)
            ->update([$column => null]);

        return $count;
    }
}
