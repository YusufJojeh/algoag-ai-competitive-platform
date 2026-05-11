<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('assistant_sessions')->cascadeOnDelete();
            $table->string('client_request_id', 36)->unique();
            $table->string('role', 20);
            $table->text('content')->nullable();
            $table->string('mode', 30)->nullable();
            $table->string('frame_path')->nullable();
            $table->string('frame_hash', 64)->nullable();
            $table->string('audio_path')->nullable();
            $table->string('tts_path')->nullable();
            $table->string('status', 20)->default('queued');
            $table->text('error_message')->nullable();
            $table->string('provider_name', 50)->nullable();
            $table->string('provider_model', 80)->nullable();
            $table->unsignedInteger('provider_latency_ms')->nullable();
            $table->unsignedInteger('queue_wait_ms')->nullable();
            $table->unsignedInteger('analysis_duration_ms')->nullable();
            $table->unsignedInteger('tts_duration_ms')->nullable();
            $table->json('token_usage')->nullable();
            $table->boolean('is_websocket_fallback')->default(false);
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_messages');
    }
};
