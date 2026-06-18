<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('problems', function (Blueprint $table) {
            $table->boolean('is_public')->default(true)->after('memory_limit_mb');
            $table->timestamp('published_at')->nullable()->after('is_public');
            $table->foreignId('published_from_contest_id')
                ->nullable()
                ->after('published_at')
                ->constrained('contests')
                ->nullOnDelete();

            $table->index(['is_public', 'published_at']);
        });

        DB::table('problems')->update([
            'is_public' => true,
            'published_at' => DB::raw('COALESCE(created_at, CURRENT_TIMESTAMP)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('problems', function (Blueprint $table) {
            $table->dropForeign(['published_from_contest_id']);
            $table->dropIndex(['is_public', 'published_at']);
            $table->dropColumn(['is_public', 'published_at', 'published_from_contest_id']);
        });
    }
};
