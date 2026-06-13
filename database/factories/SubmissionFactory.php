<?php

namespace Database\Factories;

use App\Models\Submission;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Submission>
 */
class SubmissionFactory extends Factory
{
    protected $model = Submission::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'problem_id' => Problem::factory(),
            'language' => 'python',
            'code' => "print(int(input()) * 2)",
            'verdict' => 'pending',
            'status' => Submission::STATUS_PENDING,
        ];
    }
}
