<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Onboarding');
    }

    public function complete(Request $request): RedirectResponse
    {
        $request->session()->put('onboarded', true);

        return redirect()->route('assistant.index')
            ->with('message', $request->input('locale') === 'ar' ? 'أهلاً بك في ALGOAG!' : 'Welcome to ALGOAG!');
    }
}
