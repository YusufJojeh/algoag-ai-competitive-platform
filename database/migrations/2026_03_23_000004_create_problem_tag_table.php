<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('problem_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('problem_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->unique(['problem_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('problem_tag');
    }
};
