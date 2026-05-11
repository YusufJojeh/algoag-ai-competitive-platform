<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class E2ERuntimeController extends Controller
{
    public function authFixture(): JsonResponse
    {
        // Access control is handled by the 'e2e.fixtures' middleware
        // (env + ENABLE_E2E_FIXTURES + X-E2E-Secret header).
        $this->ensureFixtureUser();

        return response()->json([
            'email' => 'e2e@example.test',
            'password' => 'password',
        ]);
    }

    public function authLogin(Request $request): RedirectResponse
    {
        // Access control is handled by the 'e2e.fixtures' middleware.
        $user = $this->ensureFixtureUser();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->to('/assistant?ui_locale='.app()->getLocale());
    }

    private function ensureFixtureUser(): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'e2e@example.test'],
            [
                'name' => 'E2E User',
                'password' => Hash::make('password'),
            ]
        );
        // is_admin is not mass-assignable; set directly on trusted fixture user.
        if (! $user->is_admin) {
            $user->is_admin = true;
            $user->save();
        }

        return $user;
    }
}
