<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_index_problems', function (Blueprint $table): void {
            $table->id();
            $table->string('problem_id')->unique();
            $table->string('slug')->index();
            $table->string('status', 32)->index();
            $table->json('locale_flags')->nullable();
            $table->json('pattern_ids')->nullable();
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->string('content_hash', 128);
            $table->string('git_sha', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('content_index_patterns', function (Blueprint $table): void {
            $table->id();
            $table->string('pattern_id')->unique();
            $table->string('status', 32)->index();
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->string('content_hash', 128);
            $table->string('git_sha', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('verification_runs', function (Blueprint $table): void {
            $table->id();
            $table->string('run_id', 26)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('problem_id');
            $table->string('suite_id');
            $table->string('solution_id')->nullable();
            $table->unsignedBigInteger('submission_id')->nullable();
            $table->string('status', 32)->index();
            $table->string('engine', 64)->nullable();
            $table->string('problem_content_version', 32)->nullable();
            $table->string('suite_content_hash', 128)->nullable();
            $table->string('commit_sha', 64)->nullable();
            $table->json('summary_json')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['problem_id', 'status']);
        });

        Schema::create('verification_case_results', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('verification_run_id')->constrained('verification_runs')->cascadeOnDelete();
            $table->string('case_key', 128);
            $table->string('status', 32);
            $table->unsignedInteger('time_ms')->nullable();
            $table->unsignedInteger('memory_kb')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();

            $table->unique(['verification_run_id', 'case_key']);
        });

        Schema::create('ollama_prompt_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('log_id', 26)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('prompt_hash', 128)->index();
            $table->string('model', 128);
            $table->string('request_id', 64)->nullable();
            $table->string('status', 16)->index();
            $table->unsignedInteger('tokens')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('ollama_explanations', function (Blueprint $table): void {
            $table->id();
            $table->string('explanation_job_id', 26)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('problem_id')->nullable()->index();
            $table->string('solution_id')->nullable();
            $table->string('status', 32)->index();
            $table->string('output_ref')->nullable();
            $table->json('output_json')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64)->index();
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->string('status', 16)->default('unread')->index();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_events', function (Blueprint $table): void {
            $table->id();
            $table->string('event_id', 26)->unique();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('verb', 64)->index();
            $table->string('object_type', 64)->index();
            $table->string('object_id', 128)->index();
            $table->json('metadata_json')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();
        });

        Schema::create('admin_action_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 128)->index();
            $table->string('target_type', 64);
            $table->string('target_id', 128);
            $table->string('ip_address', 45)->nullable();
            $table->json('payload_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_action_logs');
        Schema::dropIfExists('activity_events');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('ollama_explanations');
        Schema::dropIfExists('ollama_prompt_logs');
        Schema::dropIfExists('verification_case_results');
        Schema::dropIfExists('verification_runs');
        Schema::dropIfExists('content_index_patterns');
        Schema::dropIfExists('content_index_problems');
    }
};
