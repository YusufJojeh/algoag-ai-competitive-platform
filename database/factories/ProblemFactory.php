<?php

namespace Database\Factories;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Problem>
 */
class ProblemFactory extends Factory
{
    protected $model = Problem::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(3, true));

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 999999),
            'statement' => $this->faker->paragraph(),
            'difficulty' => $this->faker->randomElement(['easy', 'medium', 'hard']),
            'time_limit_ms' => 1000,
            'memory_limit_mb' => 256,
            'is_public' => true,
            'published_at' => now(),
        ];
    }

    public function contestOnly(): static
    {
        return $this->state(fn () => [
            'is_public' => false,
            'published_at' => null,
        ]);
    }
}
