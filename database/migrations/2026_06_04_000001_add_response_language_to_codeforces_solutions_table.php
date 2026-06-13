<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->string('response_language', 5)->default('ar')->after('solution_language');
        });
    }

    public function down(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table) {
            $table->dropColumn('response_language');
        });
    }
};
