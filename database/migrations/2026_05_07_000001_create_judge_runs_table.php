<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_runs', function (Blueprint $table) {
            $table->id();
            // Intentionally no FK constraint — avoids migrate:fresh ordering issues across modules
            $table->unsignedBigInteger('codeforces_solution_id')->nullable();
            $table->string('language', 20)->default('python');
            $table->string('status', 30)->default('pending');
            $table->string('verdict', 30)->nullable();
            $table->longText('source_code')->nullable();
            $table->json('tests_json')->nullable();
            $table->longText('compile_stdout')->nullable();
            $table->longText('compile_stderr')->nullable();
            $table->json('run_results_json')->nullable();
            $table->unsignedInteger('runtime_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['codeforces_solution_id', 'created_at']);
            $table->index('verdict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_runs');
    }
};
