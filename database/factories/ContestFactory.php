<?php

namespace Database\Factories;

use App\Modules\Arena\Models\Contest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Contest>
 */
class ContestFactory extends Factory
{
    protected $model = Contest::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(2, true)).' Round';

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 999999),
            'description' => $this->faker->sentence(),
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addHour(),
            'is_public' => true,
            'is_practice' => false,
            'created_by' => null,
        ];
    }

    public function upcoming(): static
    {
        return $this->state(fn () => ['starts_at' => now()->addDay(), 'ends_at' => now()->addDays(2)]);
    }

    public function ended(): static
    {
        return $this->state(fn () => ['starts_at' => now()->subDays(2), 'ends_at' => now()->subDay()]);
    }

    public function practice(): static
    {
        return $this->state(fn () => ['is_practice' => true, 'starts_at' => null, 'ends_at' => null]);
    }
}
