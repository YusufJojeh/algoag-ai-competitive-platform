<?php

namespace App\Policies;

use App\Models\AlgorithmSession;
use App\Models\User;

class AlgorithmSessionPolicy
{
    public function view(User $user, AlgorithmSession $algorithmSession): bool
    {
        return $algorithmSession->user_id !== null
            && (int) $user->id === (int) $algorithmSession->user_id;
    }
}
