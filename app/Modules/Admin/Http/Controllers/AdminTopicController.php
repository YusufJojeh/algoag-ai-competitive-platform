<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminTopicController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Topics/Index', [
            'topics' => Tag::query()
                ->withCount('problems')
                ->orderBy('name')
                ->paginate(50, ['id', 'name', 'slug', 'created_at', 'updated_at']),
            'flash' => ['message' => session('message')],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Topics/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        Tag::query()->create($this->validatedAttributes($request));

        return redirect()->route('admin.topics.index')->with('message', 'Topic created.');
    }

    public function edit(Tag $topic): Response
    {
        return Inertia::render('Admin/Topics/Edit', [
            'topic' => [
                'id' => $topic->id,
                'name' => $topic->name,
                'slug' => $topic->slug,
            ],
        ]);
    }

    public function update(Request $request, Tag $topic): RedirectResponse
    {
        $topic->update($this->validatedAttributes($request, $topic));

        return redirect()->route('admin.topics.index')->with('message', 'Topic updated.');
    }

    public function destroy(Tag $topic): RedirectResponse
    {
        $topic->delete();

        return redirect()->route('admin.topics.index')->with('message', 'Topic deleted.');
    }

    /**
     * @return array{name: string, slug: string}
     */
    private function validatedAttributes(Request $request, ?Tag $topic = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('tags', 'slug')->ignore($topic?->id),
            ],
        ]);
    }
}
