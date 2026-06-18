<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->text('description')->nullable()->after('title');
            $table->longText('content')->nullable()->after('body');
            $table->string('video_url')->nullable()->after('content');
            $table->boolean('is_published')->default(true)->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['description', 'content', 'video_url', 'is_published']);
        });
    }
};
