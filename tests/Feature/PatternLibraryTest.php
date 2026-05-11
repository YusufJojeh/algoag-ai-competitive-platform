<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatternLibraryTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    public function test_patterns_index_is_public_and_lists_indexed_patterns(): void
    {
        config(['content.index_enabled' => true]);

        $this->artisan('content:index')->assertSuccessful();

        $response = $this->get('/patterns');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Patterns/Index')
            ->has('patterns')
            ->has('filters')
            ->has('meta'));
    }

    public function test_patterns_show_resolves_known_pattern(): void
    {
        config(['content.index_enabled' => true]);
        $this->artisan('content:index')->assertSuccessful();

        $response = $this->get('/patterns/io-basics');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Patterns/Show')
            ->where('pattern.pattern_id', 'io-basics'));
    }

    public function test_patterns_show_returns_404_for_unknown_slug(): void
    {
        $response = $this->get('/patterns/does-not-exist-'.uniqid());
        $response->assertNotFound();
    }

    public function test_patterns_index_supports_search_query(): void
    {
        config(['content.index_enabled' => true]);
        $this->artisan('content:index')->assertSuccessful();

        $response = $this->get('/patterns?q='.urlencode('إدخال'));
        $response->assertOk();
    }
}
