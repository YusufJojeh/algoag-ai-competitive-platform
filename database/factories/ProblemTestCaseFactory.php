<?php

namespace Database\Factories;

use App\Models\ProblemTestCase;
use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProblemTestCase>
 */
class ProblemTestCaseFactory extends Factory
{
    protected $model = ProblemTestCase::class;

    public function definition(): array
    {
        return [
            'problem_id' => Problem::factory(),
            'ordinal' => 0,
            'input' => '1',
            'expected_output' => '1',
            'is_sample' => false,
        ];
    }

    public function sample(): static
    {
        return $this->state(fn () => ['is_sample' => true]);
    }
}
