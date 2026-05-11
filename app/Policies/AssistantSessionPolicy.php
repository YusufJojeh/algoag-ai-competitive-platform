<?php

namespace App\Policies;

use App\Models\AssistantSession;
use App\Models\User;

class AssistantSessionPolicy
{
    public function view(User $user, AssistantSession $session): bool
    {
        return $user->id === $session->user_id;
    }

    public function update(User $user, AssistantSession $session): bool
    {
        return $user->id === $session->user_id;
    }
}
