<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Tag;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTopicCourseCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_edit_and_delete_topic(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/topics', [
            'name' => 'Two pointers',
            'slug' => 'two-pointers',
        ])->assertRedirect(route('admin.topics.index'));

        $topic = Tag::query()->where('slug', 'two-pointers')->firstOrFail();

        $this->actingAs($admin)->put("/admin/topics/{$topic->id}", [
            'name' => 'Sliding window',
            'slug' => 'sliding-window',
        ])->assertRedirect(route('admin.topics.index'));

        $this->assertDatabaseHas('tags', ['id' => $topic->id, 'name' => 'Sliding window', 'slug' => 'sliding-window']);

        $this->actingAs($admin)->delete("/admin/topics/{$topic->id}")
            ->assertRedirect(route('admin.topics.index'));

        $this->assertDatabaseMissing('tags', ['id' => $topic->id]);
    }

    public function test_admin_can_create_edit_and_delete_course_path(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/courses', [
            'title' => 'Dynamic Programming',
            'slug' => 'dynamic-programming',
            'description' => 'DP path',
        ])->assertRedirect(route('admin.courses.index'));

        $course = Course::query()->where('slug', 'dynamic-programming')->firstOrFail();

        $this->actingAs($admin)->put("/admin/courses/{$course->id}", [
            'title' => 'Graph Algorithms',
            'slug' => 'graph-algorithms',
            'description' => 'Graphs path',
        ])->assertRedirect(route('admin.courses.index'));

        $this->assertDatabaseHas('courses', ['id' => $course->id, 'title' => 'Graph Algorithms', 'slug' => 'graph-algorithms']);

        $this->actingAs($admin)->delete("/admin/courses/{$course->id}")
            ->assertRedirect(route('admin.courses.index'));

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_admin_can_create_edit_and_delete_lessons_inside_course_path(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/courses', [
            'title' => 'Dynamic Programming',
            'slug' => 'dp-path',
            'description' => 'DP path',
            'lessons' => [
                ['title' => 'Intro', 'description' => 'Start', 'content' => 'Learn states', 'position' => 0, 'is_published' => true],
                ['title' => 'Hidden draft', 'content' => 'Draft', 'position' => 1, 'is_published' => false],
            ],
        ])->assertRedirect(route('admin.courses.index'));

        $course = Course::query()->where('slug', 'dp-path')->firstOrFail();
        $lesson = $course->lessons()->where('title', 'Intro')->firstOrFail();
        $this->assertSame(2, $course->lessons()->count());

        $this->actingAs($admin)->put("/admin/courses/{$course->id}", [
            'title' => 'Dynamic Programming',
            'slug' => 'dp-path',
            'description' => 'DP path',
            'lessons' => [
                ['id' => $lesson->id, 'title' => 'Intro Updated', 'description' => 'Start here', 'content' => 'Updated content', 'position' => 0, 'is_published' => true],
            ],
        ])->assertRedirect(route('admin.courses.index'));

        $this->assertDatabaseHas('lessons', ['id' => $lesson->id, 'title' => 'Intro Updated']);
        $this->assertSame(1, $course->fresh()->lessons()->count());
    }

    public function test_public_course_page_shows_only_published_lessons(): void
    {
        $user = User::factory()->create();
        $course = Course::query()->create(['title' => 'Graphs', 'slug' => 'graphs', 'description' => 'Graph path']);
        Lesson::query()->create(['course_id' => $course->id, 'title' => 'BFS', 'body' => 'BFS body', 'content' => 'BFS content', 'position' => 0, 'is_published' => true]);
        Lesson::query()->create(['course_id' => $course->id, 'title' => 'Draft', 'body' => 'Draft body', 'content' => 'Draft content', 'position' => 1, 'is_published' => false]);

        $this->actingAs($user)->get('/courses/'.$course->id)
            ->assertInertia(fn ($page) => $page
                ->where('course.lessons.0.title', 'BFS')
                ->has('course.lessons', 1)
            );
    }

    public function test_admin_created_topic_appears_in_landing_and_filters_problems(): void
    {
        $user = User::factory()->create();
        $topic = Tag::query()->create(['name' => 'Two Pointers', 'slug' => 'two-pointers']);
        $problem = Problem::factory()->create(['title' => 'Pairs']);
        $problem->tags()->attach($topic);

        $this->get('/')
            ->assertInertia(fn ($page) => $page
                ->where('topics.0.name', 'Two Pointers')
            );

        $this->actingAs($user)->get('/problems?topic=two-pointers')
            ->assertInertia(fn ($page) => $page
                ->where('filters.topic.slug', 'two-pointers')
                ->where('problems.0.title', 'Pairs')
            );
    }

    public function test_non_admin_cannot_access_topic_or_course_admin_pages(): void
    {
        $user = User::factory()->create();
        $topic = Tag::query()->create(['name' => 'Math', 'slug' => 'math']);
        $course = Course::query()->create(['title' => 'Basics', 'slug' => 'basics']);

        $this->actingAs($user)->get('/admin/topics')->assertForbidden();
        $this->actingAs($user)->get('/admin/topics/create')->assertForbidden();
        $this->actingAs($user)->get("/admin/topics/{$topic->id}/edit")->assertForbidden();

        $this->actingAs($user)->get('/admin/courses')->assertForbidden();
        $this->actingAs($user)->get('/admin/courses/create')->assertForbidden();
        $this->actingAs($user)->get("/admin/courses/{$course->id}/edit")->assertForbidden();
    }
}
