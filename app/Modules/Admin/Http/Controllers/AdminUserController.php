<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::query()
                ->withCount(['algorithmSessions', 'codeforcesSolutions', 'submissions'])
                ->latest()
                ->paginate(25, ['id', 'name', 'email', 'is_admin', 'created_at']),
            'flash' => [
                'message' => session('message'),
            ],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'is_admin' => ['required', 'boolean'],
        ]);

        if ($request->user()->is($user) && $validated['is_admin'] === false) {
            return back()->withErrors([
                'is_admin' => 'You cannot remove your own admin access.',
            ]);
        }

        $user->is_admin = (bool) $validated['is_admin'];
        $user->save();

        return back()->with('message', 'User access updated.');
    }
}
