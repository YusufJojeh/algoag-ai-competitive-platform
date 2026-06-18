<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminCourseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Courses/Index', [
            'courses' => Course::query()
                ->withCount('lessons')
                ->orderBy('title')
                ->paginate(50, ['id', 'title', 'slug', 'description', 'created_at', 'updated_at']),
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Courses/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedAttributes($request);
        $course = Course::query()->create(collect($validated)->except('lessons')->all());
        $this->syncLessons($course, $validated['lessons'] ?? []);

        return redirect()->route('admin.courses.index')->with('message', 'Course created.');
    }

    public function edit(Course $course): Response
    {
        $course->load('lessons');

        return Inertia::render('Admin/Courses/Edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'lessons' => $course->lessons->map(fn (Lesson $lesson) => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'description' => $lesson->description,
                    'content' => $lesson->content ?? $lesson->body,
                    'video_url' => $lesson->video_url,
                    'position' => $lesson->position,
                    'is_published' => (bool) $lesson->is_published,
                ])->all(),
            ],
        ]);
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $validated = $this->validatedAttributes($request, $course);
        $course->update(collect($validated)->except('lessons')->all());
        $this->syncLessons($course, $validated['lessons'] ?? []);

        return redirect()->route('admin.courses.index')->with('message', 'Course updated.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        $course->delete();

        return redirect()->route('admin.courses.index')->with('message', 'Course deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedAttributes(Request $request, ?Course $course = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('courses', 'slug')->ignore($course?->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'lessons' => ['nullable', 'array', 'max:100'],
            'lessons.*.id' => ['nullable', 'integer', 'exists:lessons,id'],
            'lessons.*.title' => ['required', 'string', 'max:255'],
            'lessons.*.description' => ['nullable', 'string', 'max:5000'],
            'lessons.*.content' => ['nullable', 'string', 'max:100000'],
            'lessons.*.video_url' => ['nullable', 'url', 'max:2048'],
            'lessons.*.position' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'lessons.*.is_published' => ['boolean'],
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $lessons
     */
    private function syncLessons(Course $course, array $lessons): void
    {
        $keptIds = [];

        foreach (array_values($lessons) as $index => $entry) {
            $content = (string) ($entry['content'] ?? '');
            $attributes = [
                'title' => $entry['title'],
                'description' => $entry['description'] ?? null,
                'position' => (int) ($entry['position'] ?? $index),
                'body' => $content,
                'content' => $content,
                'video_url' => $entry['video_url'] ?? null,
                'is_published' => (bool) ($entry['is_published'] ?? true),
            ];

            $lessonId = (int) ($entry['id'] ?? 0);
            $lesson = $lessonId > 0
                ? $course->lessons()->whereKey($lessonId)->first()
                : null;

            if ($lesson) {
                $lesson->update($attributes);
            } else {
                $lesson = $course->lessons()->create($attributes);
            }

            $keptIds[] = $lesson->id;
        }

        $course->lessons()
            ->when($keptIds !== [], fn ($query) => $query->whereNotIn('id', $keptIds))
            ->delete();
    }
}
