<?php

namespace Database\Factories;

use App\Models\Block;
use App\Models\Farm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Block>
 */
class BlockFactory extends Factory
{
    protected $model = Block::class;

    public function definition(): array
    {
        return [
            'farm_id' => Farm::factory(),
            'name' => $this->faker->streetName(),
            'type' => $this->faker->randomElement(['openfield', 'greenhouse']),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
