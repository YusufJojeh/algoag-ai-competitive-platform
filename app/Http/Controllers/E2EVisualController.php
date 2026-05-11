<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class E2EVisualController extends Controller
{
    public function landing(): Response
    {
        return Inertia::render('Landing', [
            'e2e' => [
                'disable3D' => true,
            ],
        ]);
    }

    public function login(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'e2e' => [
                'scenario' => $request->query('scenario', 'default'),
            ],
        ]);
    }

    public function assistant(Request $request): Response
    {
        return Inertia::render('Assistant', [
            'auth' => [
                'user' => [
                    'id' => 999,
                    'name' => 'Visual QA',
                    'email' => 'visual.qa@example.test',
                    'is_admin' => true,
                ],
            ],
            'e2e' => [
                'scenario' => $request->query('scenario', 'empty'),
                'mode' => $request->query('mode'),
            ],
        ]);
    }
}
