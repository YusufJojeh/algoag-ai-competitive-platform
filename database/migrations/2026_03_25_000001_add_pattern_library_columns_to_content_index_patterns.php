<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_index_patterns', function (Blueprint $table): void {
            $table->string('summary_ar')->nullable()->after('title_en');
            $table->string('summary_en')->nullable()->after('summary_ar');
            $table->json('analytics_tags')->nullable()->after('summary_en');
            $table->text('search_text')->nullable()->after('analytics_tags');
        });
    }

    public function down(): void
    {
        Schema::table('content_index_patterns', function (Blueprint $table): void {
            $table->dropColumn(['summary_ar', 'summary_en', 'analytics_tags', 'search_text']);
        });
    }
};
