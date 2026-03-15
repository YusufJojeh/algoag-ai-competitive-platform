<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('algorithm_sessions', function (Blueprint $table) {
            $table->id();
            $table->text('problem');
            $table->json('suggestions')->nullable();
            $table->json('benchmark_results')->nullable();
            $table->text('recommendation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('algorithm_sessions');
    }
};
