<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Farm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlockCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_blocks_and_filter_by_farm(): void
    {
        $farmA = Farm::factory()->create(['name' => 'Farm A']);
        $farmB = Farm::factory()->create(['name' => 'Farm B']);

        $blockA = Block::factory()->for($farmA)->create(['name' => 'Block A']);
        Block::factory()->for($farmB)->create(['name' => 'Block B']);

        $this->getJson('/api/blocks?farm_id=' . $farmA->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment([
                'id' => $blockA->id,
                'farm_id' => $farmA->id,
                'name' => 'Block A',
            ]);
    }

    public function test_can_show_a_single_block(): void
    {
        $block = Block::factory()->create();

        $this->getJson('/api/blocks/' . $block->id)
            ->assertOk()
            ->assertJsonPath('id', $block->id)
            ->assertJsonPath('farm_id', $block->farm_id)
            ->assertJsonPath('name', $block->name);
    }

    public function test_can_create_a_block(): void
    {
        $farm = Farm::factory()->create();

        $payload = [
            'farm_id' => $farm->id,
            'name' => 'New Block',
            'type' => 'openfield',
            'description' => 'Test description',
        ];

        $this->postJson('/api/blocks', $payload)
            ->assertCreated()
            ->assertJsonFragment([
                'farm_id' => $payload['farm_id'],
                'name' => $payload['name'],
                'type' => $payload['type'],
                'description' => $payload['description'],
            ]);

        $this->assertDatabaseHas('blocks', $payload);
    }

    public function test_can_update_block_details(): void
    {
        $block = Block::factory()->create([
            'name' => 'Old name',
            'description' => null,
            'type' => 'openfield',
        ]);

        $payload = [
            'name' => 'Updated name',
            'description' => 'Updated description',
            'type' => 'greenhouse',
        ];

        $this->putJson('/api/blocks/' . $block->id, $payload)
            ->assertOk()
            ->assertJsonFragment($payload);

        $this->assertDatabaseHas('blocks', [
            'id' => $block->id,
            'name' => 'Updated name',
            'description' => 'Updated description',
            'type' => 'greenhouse',
        ]);
    }

    public function test_cannot_change_block_farm(): void
    {
        $block = Block::factory()->create();
        $anotherFarm = Farm::factory()->create();

        $this->putJson('/api/blocks/' . $block->id, [
            'farm_id' => $anotherFarm->id,
        ])->assertStatus(422);

        $this->assertDatabaseHas('blocks', [
            'id' => $block->id,
            'farm_id' => $block->farm_id,
        ]);
    }

    public function test_can_delete_a_block(): void
    {
        $block = Block::factory()->create();

        $this->deleteJson('/api/blocks/' . $block->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('blocks', [
            'id' => $block->id,
        ]);
    }
}
