<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('feature', 80)->index();
            $table->string('provider', 50)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('status', 30)->index();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->json('token_usage')->nullable();
            $table->string('failure_category', 80)->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'feature', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_records');
    }
};
