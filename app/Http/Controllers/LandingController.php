<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function index(): Response
    {
        $topics = Tag::query()
            ->withCount(['problems' => fn ($query) => $query->public()])
            ->orderBy('name')
            ->limit(12)
            ->get(['id', 'name', 'slug'])
            ->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'problems_count' => $tag->problems_count,
            ])
            ->all();

        return Inertia::render('Landing', [
            'topics' => $topics,
        ]);
    }
}
