<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table): void {
            $table->string('progress_stage', 40)->nullable()->after('status')->index();
        });
    }

    public function down(): void
    {
        Schema::table('codeforces_solutions', function (Blueprint $table): void {
            $table->dropColumn('progress_stage');
        });
    }
};
