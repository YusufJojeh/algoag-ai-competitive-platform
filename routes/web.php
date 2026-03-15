<?php

use App\Http\Controllers\AlgorithmAssistantController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AlgorithmAssistantController::class, 'index'])->name('home');
Route::get('/session/{id}', [AlgorithmAssistantController::class, 'showSession'])->name('session.show');
Route::post('/suggest', [AlgorithmAssistantController::class, 'suggest'])->name('suggest');
Route::post('/benchmark', [AlgorithmAssistantController::class, 'benchmark'])->name('benchmark');
