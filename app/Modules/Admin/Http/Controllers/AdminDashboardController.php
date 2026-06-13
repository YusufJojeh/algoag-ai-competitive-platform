<?php

namespace App\Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CodeforcesSolution;
use App\Models\Course;
use App\Models\Submission;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'users' => User::query()->count(),
                'admins' => User::query()->where('is_admin', true)->count(),
                'problems' => Problem::query()->count(),
                'courses' => Course::query()->count(),
                'submissions' => Submission::query()->count(),
                'solutions' => CodeforcesSolution::query()->count(),
            ],
            'recentUsers' => User::query()
                ->latest()
                ->limit(5)
                ->get(['id', 'name', 'email', 'is_admin', 'created_at']),
            'recentProblems' => Problem::query()
                ->latest()
                ->limit(5)
                ->get(['id', 'title', 'slug', 'difficulty', 'created_at']),
            'recentSolutions' => CodeforcesSolution::query()
                ->with('user:id,name,email')
                ->latest()
                ->limit(5)
                ->get(['id', 'user_id', 'status', 'solution_language', 'response_language', 'created_at']),
        ]);
    }
}
