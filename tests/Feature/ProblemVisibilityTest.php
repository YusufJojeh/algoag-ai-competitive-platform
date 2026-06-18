<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProblemVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_problems_appear_on_problem_page(): void
    {
        $user = User::factory()->create();
        $publishedAt = now()->subHour();
        Problem::factory()->create(['title' => 'Public Problem', 'published_at' => $publishedAt]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->component('Problems/Index')
                ->has('problems', 1)
                ->where('problems.0.title', 'Public Problem')
                ->where('problems.0.time_label', 'published')
                ->where('problems.0.time_at', $publishedAt->toIso8601String()));
    }

    public function test_unpublished_contest_only_problems_do_not_appear_on_problem_page(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        Problem::factory()->create(['title' => 'Public Problem']);
        Problem::factory()->contestOnly()->create([
            'title' => 'Private Contest Problem',
            'published_from_contest_id' => $contest->id,
        ]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->component('Problems/Index')
                ->has('problems', 1)
                ->where('problems.0.title', 'Public Problem'));
    }

    public function test_future_published_problem_does_not_appear_on_problem_page(): void
    {
        $user = User::factory()->create();
        Problem::factory()->create([
            'title' => 'Future Public',
            'is_public' => true,
            'published_at' => now()->addHour(),
        ]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->component('Problems/Index')
                ->has('problems', 0));
    }

    public function test_unpublished_contest_only_problem_cannot_be_opened_through_public_problem_route(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->contestOnly()->create([
            'published_from_contest_id' => $contest->id,
        ]);

        $this->actingAs($user)->get("/problems/{$problem->id}")->assertForbidden();
    }

    public function test_joined_user_can_open_contest_only_problem_through_arena_route(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->contestOnly()->create([
            'title' => 'Hidden A',
            'published_from_contest_id' => $contest->id,
        ]);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $contest->participants()->attach($user->id, ['registered_at' => now()]);

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")
            ->assertInertia(fn ($page) => $page
                ->component('Problems/Show')
                ->where('problem.title', 'Hidden A')
                ->where('contest.id', $contest->id));
    }

    public function test_unjoined_user_cannot_open_contest_only_problem_through_arena_route(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->contestOnly()->create([
            'published_from_contest_id' => $contest->id,
        ]);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")->assertForbidden();
    }

    public function test_contest_published_problem_uses_published_at_on_problem_page(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->ended()->create();
        $publishedAt = now()->subMinutes(10);
        Problem::factory()->create([
            'title' => 'Contest Published',
            'is_public' => true,
            'published_at' => $publishedAt,
            'published_from_contest_id' => $contest->id,
        ]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->where('problems.0.title', 'Contest Published')
                ->where('problems.0.time_label', 'published')
                ->where('problems.0.time_at', $publishedAt->toIso8601String()));
    }

    public function test_public_problem_with_null_published_at_is_not_publicly_visible(): void
    {
        $user = User::factory()->create();
        Problem::factory()->create([
            'title' => 'Legacy Public',
            'is_public' => true,
            'published_at' => null,
        ]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->has('problems', 0));
    }

    public function test_extreme_difficulty_is_returned_for_problem_page_rendering(): void
    {
        $user = User::factory()->create();
        Problem::factory()->create([
            'title' => 'Extreme Problem',
            'difficulty' => 'extreme',
        ]);

        $this->actingAs($user)->get('/problems')
            ->assertInertia(fn ($page) => $page
                ->where('problems.0.title', 'Extreme Problem')
                ->where('problems.0.difficulty', 'extreme'));
    }
}
