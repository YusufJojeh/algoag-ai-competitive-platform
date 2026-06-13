<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contests', function (Blueprint $table) {
            // Practice contests accept submissions anytime; timed contests are gated
            // by starts_at/ends_at.
            $table->boolean('is_practice')->default(false)->after('is_public');
        });
    }

    public function down(): void
    {
        Schema::table('contests', function (Blueprint $table) {
            $table->dropColumn('is_practice');
        });
    }
};
