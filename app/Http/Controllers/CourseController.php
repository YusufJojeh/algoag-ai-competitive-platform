<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Course::class);

        $courses = Course::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Course $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'slug' => $c->slug,
                'description' => $c->description,
            ])
            ->all();

        return Inertia::render('Courses/Index', [
            'courses' => $courses,
        ]);
    }

    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', $course);

        $course->load('publishedLessons');

        return Inertia::render('Courses/Show', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'lessons' => $course->publishedLessons->map(fn ($l) => [
                    'id' => $l->id,
                    'title' => $l->title,
                    'description' => $l->description,
                    'position' => $l->position,
                    'content' => $l->content ?? $l->body,
                    'body' => $l->content ?? $l->body,
                    'video_url' => $l->video_url,
                ])->all(),
            ],
        ]);
    }
}
