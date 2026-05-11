<?php

namespace Tests\Feature;

use App\Models\ContentIndexPattern;
use App\Models\ContentIndexProblem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentIndexCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    public function test_content_index_upserts_rows(): void
    {
        config(['content.index_enabled' => true]);

        $this->artisan('content:index')->assertSuccessful();

        $this->assertDatabaseHas('content_index_problems', [
            'problem_id' => 'a-plus-b-pilot',
            'slug' => 'a-plus-b-pilot',
        ]);
        $row = ContentIndexPattern::query()->where('pattern_id', 'io-basics')->first();
        $this->assertNotNull($row);
        $this->assertNotNull($row->summary_ar);
        $this->assertNotNull($row->summary_en);
        $this->assertNotNull($row->search_text);
        $this->assertIsArray($row->analytics_tags);
        $this->assertSame(1, ContentIndexProblem::query()->where('problem_id', 'a-plus-b-pilot')->count());
        $this->assertGreaterThanOrEqual(1, ContentIndexPattern::query()->count());
    }
}
