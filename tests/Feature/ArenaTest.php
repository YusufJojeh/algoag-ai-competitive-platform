<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArenaTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_lists_public_contests_and_hides_private_from_users(): void
    {
        $user = User::factory()->create();
        Contest::factory()->create(['title' => 'Public Cup', 'is_public' => true]);
        Contest::factory()->create(['title' => 'Hidden Cup', 'is_public' => false]);

        $response = $this->actingAs($user)->get('/arena');

        $response->assertInertia(fn ($page) => $page
            ->component('Arena/Index')
            ->has('contests', 1)
            ->where('contests.0.title', 'Public Cup'));
    }

    public function test_show_returns_problems_with_labels(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->create(['title' => 'A Plus B']);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $response = $this->actingAs($user)->get("/arena/{$contest->slug}");

        $response->assertInertia(fn ($page) => $page
            ->component('Arena/Show')
            ->where('problems.0.label', 'A')
            ->where('problems.0.title', 'A Plus B'));
    }

    public function test_private_contest_is_not_visible_to_normal_users(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create(['is_public' => false]);

        $this->actingAs($user)->get("/arena/{$contest->slug}")->assertNotFound();
    }

    public function test_standings_page_renders(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $this->actingAs($user)->get("/arena/{$contest->slug}/standings")
            ->assertInertia(fn ($page) => $page->component('Arena/Standings'));
    }

    public function test_admin_can_create_contest_with_problems(): void
    {
        $admin = User::factory()->admin()->create();
        $problem = Problem::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Round X',
            'slug' => 'round-x',
            'description' => 'desc',
            'is_public' => true,
            'problems' => [['problem_id' => $problem->id, 'label' => 'A']],
        ]);

        $response->assertRedirect(route('admin.contests.index'));
        $contest = Contest::query()->where('slug', 'round-x')->first();
        $this->assertNotNull($contest);
        $this->assertSame(1, $contest->contestProblems()->count());
    }

    public function test_non_admin_cannot_manage_contests(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/contests')->assertForbidden();
    }
}
