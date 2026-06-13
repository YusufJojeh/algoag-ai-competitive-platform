<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('problem_test_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('problem_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('ordinal')->default(0);
            $table->longText('input');
            $table->longText('expected_output');
            // Only sample cases ever have their input/output exposed to normal users.
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['problem_id', 'ordinal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('problem_test_cases');
    }
};
