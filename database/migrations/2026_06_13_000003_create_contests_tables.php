<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_public')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('contest_problems', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('problem_id')->constrained()->cascadeOnDelete();
            $table->string('label', 8)->default('A');
            $table->unsignedInteger('ordinal')->default(0);
            $table->timestamps();

            $table->unique(['contest_id', 'problem_id']);
            $table->index(['contest_id', 'ordinal']);
        });

        Schema::create('contest_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();

            $table->unique(['contest_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contest_participants');
        Schema::dropIfExists('contest_problems');
        Schema::dropIfExists('contests');
    }
};
