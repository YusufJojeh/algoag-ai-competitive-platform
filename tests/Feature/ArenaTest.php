<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Arena\Models\Contest;
use App\Modules\Problems\Models\Problem;
use Illuminate\Support\Carbon;
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
            'is_practice' => true,
            'problems' => [['problem_id' => $problem->id, 'label' => 'A']],
        ]);

        $response->assertRedirect(route('admin.contests.index'));
        $contest = Contest::query()->where('slug', 'round-x')->first();
        $this->assertNotNull($contest);
        $this->assertTrue((bool) $contest->is_practice);
        $this->assertSame(1, $contest->contestProblems()->count());
    }

    public function test_admin_can_create_timed_contest_starting_two_minutes_from_now(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Two Minute Round',
            'slug' => 'two-minute-round',
            'description' => 'Starts soon',
            'starts_at' => now()->addMinutes(2)->format('Y-m-d H:i:s'),
            'duration_hours' => 1,
            'duration_minutes' => 0,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ]);

        $response->assertRedirect(route('admin.contests.index'));
        $this->assertDatabaseHas('contests', ['slug' => 'two-minute-round']);
        $this->assertTrue(Contest::query()->where('slug', 'two-minute-round')->firstOrFail()->starts_at->equalTo(now()->addMinutes(2)));
        Carbon::setTestNow();
    }

    public function test_admin_contest_start_less_than_two_minutes_is_adjusted_not_forced_to_three_hours(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Adjusted Round',
            'slug' => 'adjusted-round',
            'starts_at' => now()->addMinute()->format('Y-m-d H:i:s'),
            'duration_hours' => 1,
            'duration_minutes' => 0,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest = Contest::query()->where('slug', 'adjusted-round')->firstOrFail();
        $this->assertTrue($contest->starts_at->equalTo(now()->addMinutes(2)));
        $this->assertFalse($contest->starts_at->equalTo(now()->addHours(3)));
        $this->assertTrue($contest->ends_at->equalTo(now()->addMinutes(62)));
        Carbon::setTestNow();
    }

    public function test_admin_contest_start_uses_configured_app_timezone_without_three_hour_shift(): void
    {
        $originalTimezone = config('app.timezone');
        $originalPhpTimezone = date_default_timezone_get();
        config(['app.timezone' => 'Asia/Damascus']);
        date_default_timezone_set('Asia/Damascus');
        Carbon::setTestNow(Carbon::parse('2026-06-18 12:00:00', 'Asia/Damascus'));
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Timezone Round',
            'slug' => 'timezone-round',
            'starts_at' => '2026-06-18T12:02',
            'duration_hours' => 0,
            'duration_minutes' => 30,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest = Contest::query()->where('slug', 'timezone-round')->firstOrFail();
        $this->assertTrue($contest->starts_at->equalTo(Carbon::parse('2026-06-18 12:02:00', 'Asia/Damascus')));
        $this->assertTrue($contest->ends_at->equalTo(Carbon::parse('2026-06-18 12:32:00', 'Asia/Damascus')));
        $this->assertFalse($contest->starts_at->equalTo(now('Asia/Damascus')->addHours(3)));

        Carbon::setTestNow();
        config(['app.timezone' => $originalTimezone]);
        date_default_timezone_set($originalPhpTimezone);
    }

    public function test_arena_status_tracks_start_and_end_in_configured_app_timezone(): void
    {
        $originalTimezone = config('app.timezone');
        $originalPhpTimezone = date_default_timezone_get();
        config(['app.timezone' => 'Asia/Damascus']);
        date_default_timezone_set('Asia/Damascus');
        $user = User::factory()->create();
        $contest = Contest::factory()->create([
            'title' => 'Status Round',
            'slug' => 'status-round',
            'starts_at' => Carbon::parse('2026-06-18 12:02:00', 'Asia/Damascus'),
            'ends_at' => Carbon::parse('2026-06-18 12:32:00', 'Asia/Damascus'),
            'is_public' => true,
            'is_practice' => false,
        ]);

        Carbon::setTestNow(Carbon::parse('2026-06-18 12:00:00', 'Asia/Damascus'));
        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.status', 'upcoming')
                ->where('contest.accepts_submissions', false)
            );

        Carbon::setTestNow(Carbon::parse('2026-06-18 12:03:00', 'Asia/Damascus'));
        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.status', 'running')
                ->where('contest.accepts_submissions', true)
            );

        Carbon::setTestNow(Carbon::parse('2026-06-18 12:33:00', 'Asia/Damascus'));
        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.status', 'ended')
                ->where('contest.accepts_submissions', false)
            );

        Carbon::setTestNow();
        config(['app.timezone' => $originalTimezone]);
        date_default_timezone_set($originalPhpTimezone);
    }

    public function test_admin_can_create_timed_contest_with_thirty_minute_duration(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();
        $startsAt = now()->addMinutes(10);

        $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Thirty Minute Round',
            'slug' => 'thirty-minute-round',
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'duration_hours' => 0,
            'duration_minutes' => 30,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest = Contest::query()->where('slug', 'thirty-minute-round')->firstOrFail();
        $this->assertTrue($contest->starts_at->equalTo($startsAt));
        $this->assertTrue($contest->ends_at->equalTo($startsAt->copy()->addMinutes(30)));
        Carbon::setTestNow();
    }

    public function test_admin_can_create_timed_contest_with_one_hour_fifteen_minute_duration(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();
        $startsAt = now()->addMinutes(15);

        $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Seventy Five Minute Round',
            'slug' => 'seventy-five-minute-round',
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'duration_hours' => 1,
            'duration_minutes' => 15,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest = Contest::query()->where('slug', 'seventy-five-minute-round')->firstOrFail();
        $this->assertTrue($contest->ends_at->equalTo($startsAt->copy()->addMinutes(75)));
        Carbon::setTestNow();
    }

    public function test_timed_contest_duration_less_than_two_minutes_is_rejected(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->from('/admin/contests/create')->post('/admin/contests', [
            'title' => 'Too Short Round',
            'slug' => 'too-short-round',
            'starts_at' => now()->addMinutes(10)->format('Y-m-d H:i:s'),
            'duration_hours' => 0,
            'duration_minutes' => 1,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect('/admin/contests/create')
            ->assertSessionHasErrors('duration_minutes');

        $this->assertDatabaseMissing('contests', ['slug' => 'too-short-round']);
        Carbon::setTestNow();
    }

    public function test_practice_contest_can_be_saved_without_duration(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/contests', [
            'title' => 'Practice Without Duration',
            'slug' => 'practice-without-duration',
            'is_public' => true,
            'is_practice' => true,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest = Contest::query()->where('slug', 'practice-without-duration')->firstOrFail();
        $this->assertTrue((bool) $contest->is_practice);
        $this->assertNull($contest->ends_at);
    }

    public function test_updating_duration_recalculates_contest_end_time(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();
        $contest = Contest::factory()->create([
            'title' => 'Duration Edit',
            'slug' => 'duration-edit',
            'starts_at' => now()->addMinutes(20),
            'ends_at' => now()->addMinutes(50),
            'is_practice' => false,
        ]);
        $startsAt = now()->addMinutes(30);

        $this->actingAs($admin)->put('/admin/contests/'.$contest->slug, [
            'title' => 'Duration Edit Updated',
            'slug' => 'duration-edit',
            'description' => $contest->description,
            'starts_at' => $startsAt->format('Y-m-d H:i:s'),
            'duration_hours' => 2,
            'duration_minutes' => 15,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest->refresh();
        $this->assertTrue($contest->starts_at->equalTo($startsAt));
        $this->assertTrue($contest->ends_at->equalTo($startsAt->copy()->addMinutes(135)));
        Carbon::setTestNow();
    }

    public function test_updating_contest_start_less_than_two_minutes_adjusts_to_two_minutes_not_three_hours(): void
    {
        Carbon::setTestNow('2026-06-18 12:00:00');
        $admin = User::factory()->admin()->create();
        $contest = Contest::factory()->create([
            'title' => 'Start Edit',
            'slug' => 'start-edit',
            'starts_at' => now()->addMinutes(20),
            'ends_at' => now()->addMinutes(50),
            'is_practice' => false,
        ]);

        $this->actingAs($admin)->put('/admin/contests/'.$contest->slug, [
            'title' => 'Start Edit Updated',
            'slug' => 'start-edit',
            'description' => $contest->description,
            'starts_at' => now()->addMinute()->format('Y-m-d H:i:s'),
            'duration_hours' => 0,
            'duration_minutes' => 30,
            'is_public' => true,
            'is_practice' => false,
            'problems' => [],
        ])->assertRedirect(route('admin.contests.index'));

        $contest->refresh();
        $this->assertTrue($contest->starts_at->equalTo(now()->addMinutes(2)));
        $this->assertFalse($contest->starts_at->equalTo(now()->addHours(3)));
        $this->assertTrue($contest->ends_at->equalTo(now()->addMinutes(32)));
        Carbon::setTestNow();
    }

    public function test_admin_can_open_contest_edit_page_by_slug(): void
    {
        $admin = User::factory()->admin()->create();
        $contest = Contest::factory()->create(['slug' => 'edit-by-slug']);

        $this->actingAs($admin)->get('/admin/contests/edit-by-slug/edit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Contests/Edit')
                ->where('contest.slug', 'edit-by-slug')
            );
    }

    public function test_admin_can_update_contest_practice_mode(): void
    {
        $admin = User::factory()->admin()->create();
        $contest = Contest::factory()->create(['is_practice' => false]);

        $response = $this->actingAs($admin)->put('/admin/contests/'.$contest->slug, [
            'title' => $contest->title,
            'slug' => $contest->slug,
            'description' => $contest->description,
            'starts_at' => $contest->starts_at?->toDateTimeString(),
            'is_public' => true,
            'is_practice' => true,
            'problems' => [],
        ]);

        $response->assertRedirect(route('admin.contests.index'));
        $this->assertTrue((bool) $contest->fresh()->is_practice);
    }

    public function test_non_admin_cannot_manage_contests(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin/contests')->assertForbidden();
    }

    public function test_joined_user_sees_problem_names_but_cannot_open_before_start(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->upcoming()->create();
        $problem = Problem::factory()->contestOnly()->create(['title' => 'Hidden A', 'difficulty' => 'hard']);
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $contest->participants()->attach($user->id, ['registered_at' => now()]);

        $response = $this->actingAs($user)->get("/arena/{$contest->slug}");

        $response->assertInertia(fn ($page) => $page
            ->component('Arena/Show')
            ->where('contest.status', 'upcoming')
            ->where('joined', true)
            ->where('problems.0.title', 'Hidden A')
            ->where('problems.0.difficulty', null)
            ->where('problems.0.can_open', false)
        );

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")->assertForbidden();
    }

    public function test_joined_user_can_open_problem_during_running_contest(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->contestOnly()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $contest->participants()->attach($user->id, ['registered_at' => now()]);

        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.status', 'running')
                ->where('problems.0.difficulty', null)
                ->where('problems.0.can_open', true)
            );

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Problems/Show'));
    }

    public function test_unjoined_user_cannot_open_arena_problem(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->create();
        $problem = Problem::factory()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")->assertForbidden();
    }

    public function test_ended_contest_shows_ended_status_and_blocks_statement_route(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->ended()->create();
        $problem = Problem::factory()->contestOnly()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $contest->participants()->attach($user->id, ['registered_at' => now()]);

        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.status', 'ended')
                ->where('problems.0.can_open', false)
                ->where('problems.0.difficulty', null)
            );

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")->assertForbidden();
    }

    public function test_joined_user_can_open_practice_contest_problem(): void
    {
        $user = User::factory()->create();
        $contest = Contest::factory()->practice()->create();
        $problem = Problem::factory()->contestOnly()->create();
        $contest->contestProblems()->create(['problem_id' => $problem->id, 'label' => 'A', 'ordinal' => 0]);
        $contest->participants()->attach($user->id, ['registered_at' => now()]);

        $this->actingAs($user)->get("/arena/{$contest->slug}")
            ->assertInertia(fn ($page) => $page
                ->where('contest.is_practice', true)
                ->where('problems.0.can_open', true)
                ->where('problems.0.difficulty', null)
            );

        $this->actingAs($user)->get("/arena/{$contest->slug}/problems/{$problem->id}")->assertOk();
    }
}
