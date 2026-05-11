<?php

namespace App\Modules\Problems\Policies;

use App\Models\User;
use App\Modules\Problems\Models\Problem;

class ProblemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Problem $problem): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->is_admin === true;
    }

    public function update(User $user, Problem $problem): bool
    {
        return $user->is_admin === true;
    }

    public function delete(User $user, Problem $problem): bool
    {
        return $user->is_admin === true;
    }
}
