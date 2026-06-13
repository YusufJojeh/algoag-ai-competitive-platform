<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProblemAdminControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
    }

    public function test_guest_cannot_access_admin_problems(): void
    {
        $this->get('/admin/problems')->assertRedirect(route('login'));
    }

    public function test_non_admin_gets_403(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->actingAs($user)->get('/admin/problems')->assertForbidden();
    }

    public function test_admin_can_list_problems(): void
    {
        $admin = User::factory()->admin()->create();
        Problem::query()->create([
            'title' => 'T',
            'slug' => 't-slug',
            'statement' => 'S',
            'difficulty' => 'easy',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 256,
        ]);

        $response = $this->actingAs($admin)->get('/admin/problems');

        $response->assertStatus(200);
        // PERF-04: index now returns a paginator — Inertia receives 'data' key.
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Problems/Index')
            ->has('problems.data', 1)
        );
    }

    public function test_admin_dashboard_returns_real_management_counts(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create();
        Problem::query()->create([
            'title' => 'T',
            'slug' => 'dashboard-problem',
            'statement' => 'S',
            'difficulty' => 'easy',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 256,
        ]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.users', 2)
            ->where('stats.admins', 1)
            ->where('stats.problems', 1)
            ->has('recentUsers')
            ->has('recentProblems')
        );
    }

    public function test_admin_settings_returns_runtime_configuration(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Settings')
            ->has('settings.app.name')
            ->has('settings.services')
            ->has('settings.limits')
        );
    }

    public function test_admin_can_manage_user_roles_but_not_remove_self(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($admin)
            ->put('/admin/users/'.$user->id, ['is_admin' => true])
            ->assertRedirect();

        $this->assertTrue((bool) $user->fresh()->is_admin);

        $this->actingAs($admin)
            ->put('/admin/users/'.$admin->id, ['is_admin' => false])
            ->assertSessionHasErrors('is_admin');

        $this->assertTrue((bool) $admin->fresh()->is_admin);
    }

    // PERF-04: response must include pagination metadata (LengthAwarePaginator).
    public function test_admin_problem_index_returns_paginated_response(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (range(1, 3) as $i) {
            Problem::query()->create([
                'title' => "Problem {$i}",
                'slug' => "problem-{$i}",
                'statement' => 'S',
                'difficulty' => 'easy',
                'time_limit_ms' => 1000,
                'memory_limit_mb' => 256,
            ]);
        }

        $response = $this->actingAs($admin)->get('/admin/problems');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('problems.data')
            ->has('problems.total')
            ->has('problems.per_page')
            ->has('problems.current_page')
        );
    }

    public function test_admin_can_create_problem(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/problems', [
            'title' => 'New',
            'slug' => 'new-problem',
            'statement' => 'Statement text.',
            'difficulty' => 'medium',
            'time_limit_ms' => 2000,
            'memory_limit_mb' => 512,
        ]);

        $response->assertRedirect(route('admin.problems.index'));
        $this->assertDatabaseHas('problems', [
            'slug' => 'new-problem',
            'title' => 'New',
        ]);
    }

    public function test_admin_can_update_problem(): void
    {
        $admin = User::factory()->admin()->create();
        $p = Problem::query()->create([
            'title' => 'Old',
            'slug' => 'old-slug',
            'statement' => 'Old statement.',
            'difficulty' => 'easy',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 256,
        ]);

        $response = $this->actingAs($admin)->put('/admin/problems/'.$p->id, [
            'title' => 'New title',
            'slug' => 'old-slug',
            'statement' => 'Updated.',
            'difficulty' => 'hard',
            'time_limit_ms' => 3000,
            'memory_limit_mb' => 128,
        ]);

        $response->assertRedirect(route('admin.problems.index'));
        $p->refresh();
        $this->assertSame('New title', $p->title);
        $this->assertSame('hard', $p->difficulty);
    }

    public function test_admin_can_delete_problem(): void
    {
        $admin = User::factory()->admin()->create();
        $p = Problem::query()->create([
            'title' => 'Del',
            'slug' => 'del-slug',
            'statement' => 'X',
            'difficulty' => 'easy',
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 256,
        ]);

        $response = $this->actingAs($admin)->delete('/admin/problems/'.$p->id);

        $response->assertRedirect(route('admin.problems.index'));
        $this->assertDatabaseMissing('problems', ['id' => $p->id]);
    }
}
