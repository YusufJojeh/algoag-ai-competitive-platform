<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Submission $submission): bool
    {
        return (int) $user->id === (int) $submission->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }
}
