<?php

namespace App\Policies;

use App\Models\CodeforcesSolution;
use App\Models\User;

class CodeforcesSolutionPolicy
{
    public function view(User $user, CodeforcesSolution $codeforcesSolution): bool
    {
        return $codeforcesSolution->user_id !== null
            && (int) $user->id === (int) $codeforcesSolution->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }
}
