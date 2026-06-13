<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->json('problem_text_translations')->nullable()->after('problem_text');
            $table->json('parsed_problem_translations')->nullable()->after('parsed_problem');
            $table->json('explanation_translations')->nullable()->after('explanation');
            $table->json('algorithm_breakdown_translations')->nullable()->after('algorithm_breakdown');
        });
    }

    public function down(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->dropColumn([
                'problem_text_translations',
                'parsed_problem_translations',
                'explanation_translations',
                'algorithm_breakdown_translations',
            ]);
        });
    }
};
