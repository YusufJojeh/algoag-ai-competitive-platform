<?php

namespace Database\Factories;

use App\Models\CodeforcesSolution;
use Illuminate\Database\Eloquent\Factories\Factory;

class CodeforcesSolutionFactory extends Factory
{
    protected $model = CodeforcesSolution::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'problem_text' => 'Given n, print n*2.',
            'solution_code' => 'n = int(input())\nprint(n * 2)',
            'solution_language' => 'python',
            'status' => CodeforcesSolution::STATUS_PENDING,
            'parsed_problem' => null,
            'explanation' => null,
            'generated_tests' => [],
            'run_results' => null,
            'algorithm_breakdown' => null,
            'error_message' => null,
        ];
    }
}
