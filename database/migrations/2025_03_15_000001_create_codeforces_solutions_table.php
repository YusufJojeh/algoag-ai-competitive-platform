<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('codeforces_solutions', function (Blueprint $table) {
            $table->id();
            $table->text('problem_text');
            $table->json('parsed_problem')->nullable();
            $table->text('solution_code')->nullable();
            $table->string('solution_language', 20)->nullable();
            $table->text('explanation')->nullable();
            $table->json('generated_tests')->nullable();
            $table->json('run_results')->nullable();
            $table->text('algorithm_breakdown')->nullable();
            $table->string('status', 20)->default('pending');
            $table->string('job_id', 100)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codeforces_solutions');
    }
};
