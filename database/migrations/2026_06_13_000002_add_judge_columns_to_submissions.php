<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Lifecycle of the async judge run: pending -> running -> completed.
            $table->string('status', 20)->default('pending')->after('verdict');
            $table->unsignedInteger('runtime_ms')->nullable()->after('status');
            // Per-case verdicts (no test I/O) for the submission detail page.
            $table->json('per_case_results')->nullable()->after('runtime_ms');
            // Weak reference to a contest (contests table added in the Arena phase);
            // intentionally no DB-level FK, matching existing weak references in this app.
            $table->unsignedBigInteger('contest_id')->nullable()->after('problem_id');
            $table->index('contest_id');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex(['contest_id']);
            $table->dropColumn(['status', 'runtime_ms', 'per_case_results', 'contest_id']);
        });
    }
};
