<?php

use App\Http\Controllers\AlgorithmAssistantController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CodeforcesSolveController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\E2ERuntimeController;
use App\Http\Controllers\E2EVisualController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\SubmissionController;
use App\Modules\Admin\Http\Controllers\ProblemAdminController;
use App\Modules\Patterns\Http\Controllers\PatternController;
use App\Modules\Problems\Http\Controllers\ProblemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Local/testing throttles
|--------------------------------------------------------------------------
|
| Playwright E2E should not depend on database-backed rate limiter state.
| Production keeps the throttles; local/testing uses lean middleware stacks.
|
*/
$guestLoginPostMiddleware = app()->environment(['local', 'testing']) ? [] : ['throttle:12,1'];
$guestRegisterPostMiddleware = app()->environment(['local', 'testing']) ? [] : ['throttle:8,1'];
$authGroupMiddleware = app()->environment(['local', 'testing']) ? ['auth'] : ['auth', 'throttle:180,1'];
$assistantActionMiddleware = app()->environment(['local', 'testing']) ? [] : ['throttle:20,1'];
$mutationActionMiddleware = app()->environment(['local', 'testing']) ? [] : ['throttle:60,1'];
$readActionMiddleware = app()->environment(['local', 'testing']) ? [] : ['throttle:120,1'];

Route::middleware(['throttle:120,1'])->group(function () {
    Route::get('/', [LandingController::class, 'index'])->name('landing');
    Route::get('/patterns', [PatternController::class, 'index'])->name('patterns.index');
    Route::get('/patterns/{pattern}', [PatternController::class, 'show'])->name('patterns.show');
});

if (app()->environment(['local', 'testing'])) {
    Route::prefix('__e2e/visual')->name('e2e.visual.')->group(function () {
        Route::get('/landing', [E2EVisualController::class, 'landing'])->name('landing');
        Route::get('/login', [E2EVisualController::class, 'login'])->name('login');
        Route::get('/assistant', [E2EVisualController::class, 'assistant'])->name('assistant');
    });

    Route::prefix('__e2e/runtime')->middleware('e2e.fixtures')->name('e2e.runtime.')->group(function () {
        Route::get('/auth/fixture', [E2ERuntimeController::class, 'authFixture'])->name('auth.fixture');
        Route::post('/auth/login', [E2ERuntimeController::class, 'authLogin'])->name('auth.login');
    });
}

Route::middleware('guest')->group(function () use ($guestLoginPostMiddleware, $guestRegisterPostMiddleware) {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware($guestLoginPostMiddleware);
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware($guestRegisterPostMiddleware);
});

Route::middleware($authGroupMiddleware)->group(function () use ($mutationActionMiddleware, $assistantActionMiddleware, $readActionMiddleware) {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::redirect('/dashboard', '/assistant')->name('home');

    Route::middleware($mutationActionMiddleware)->group(function () {
        Route::post('/suggest', [AlgorithmAssistantController::class, 'suggest'])->name('suggest');
        Route::post('/benchmark', [AlgorithmAssistantController::class, 'benchmark'])->name('benchmark');
        Route::post('/solve', [CodeforcesSolveController::class, 'solve'])->name('solve.run');
        Route::post('/submissions', [SubmissionController::class, 'store'])->name('submissions.store');
    });

    Route::middleware(['admin', 'throttle:120,1'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('problems', ProblemAdminController::class)->except(['show']);
    });

    Route::middleware($assistantActionMiddleware)->prefix('assistant')->name('assistant.')->group(function () {
        Route::get('/', [AssistantController::class, 'index'])->name('index');
        Route::post('/analyze', [AssistantController::class, 'analyze'])->name('analyze');
        Route::get('/sessions', [AssistantController::class, 'sessions'])->name('sessions');
        Route::get('/sessions/{session}', [AssistantController::class, 'showSession'])->name('session');
        Route::get('/messages/{message}/status', [AssistantController::class, 'messageStatus'])->name('message.status');
        Route::post('/messages/{message}/cancel', [AssistantController::class, 'cancelMessage'])->name('message.cancel');
        Route::get('/audio/{message}', [AssistantController::class, 'audio'])->middleware('signed')->name('audio');
    });

    Route::middleware($readActionMiddleware)->group(function () {
        Route::get('/session/{id}', [AlgorithmAssistantController::class, 'showSession'])->name('session.show');
        Route::get('/solve', [CodeforcesSolveController::class, 'index'])->name('solve.index');
        Route::get('/solve/result/{id}', [CodeforcesSolveController::class, 'showResult'])->name('solve.result');
        Route::get('/solve/result/{id}/status', [CodeforcesSolveController::class, 'resultStatus'])->name('solve.result.status');
        Route::get('/problems', [ProblemController::class, 'index'])->name('problems.index');
        Route::get('/problems/{problem}', [ProblemController::class, 'show'])->name('problems.show');
        Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
        Route::get('/courses/{course}', [CourseController::class, 'show'])->name('courses.show');
        Route::get('/submissions', [SubmissionController::class, 'index'])->name('submissions.index');
    });
});
