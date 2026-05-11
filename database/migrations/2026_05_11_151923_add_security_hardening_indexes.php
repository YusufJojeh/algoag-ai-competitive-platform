<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add missing indexes on foreign-key and high-cardinality lookup columns.
 * Absence caused full-table scans on every user-scoped query at scale.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('algorithm_sessions', function (Blueprint $table) {
            $table->index('user_id', 'algorithm_sessions_user_id_idx');
        });

        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->index('user_id', 'codeforces_solutions_user_id_idx');
            $table->index('status', 'codeforces_solutions_status_idx');
        });

        Schema::table('assistant_sessions', function (Blueprint $table) {
            $table->index('user_id', 'assistant_sessions_user_id_idx');
        });

        Schema::table('assistant_messages', function (Blueprint $table) {
            $table->index('session_id', 'assistant_messages_session_id_idx');
            $table->index('status', 'assistant_messages_status_idx');
            $table->index('client_request_id', 'assistant_messages_client_request_id_idx');
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->index('user_id', 'submissions_user_id_idx');
            $table->index('problem_id', 'submissions_problem_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('algorithm_sessions', function (Blueprint $table) {
            $table->dropIndex('algorithm_sessions_user_id_idx');
        });

        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->dropIndex('codeforces_solutions_user_id_idx');
            $table->dropIndex('codeforces_solutions_status_idx');
        });

        Schema::table('assistant_sessions', function (Blueprint $table) {
            $table->dropIndex('assistant_sessions_user_id_idx');
        });

        Schema::table('assistant_messages', function (Blueprint $table) {
            $table->dropIndex('assistant_messages_session_id_idx');
            $table->dropIndex('assistant_messages_status_idx');
            $table->dropIndex('assistant_messages_client_request_id_idx');
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex('submissions_user_id_idx');
            $table->dropIndex('submissions_problem_id_idx');
        });
    }
};
