<?php

namespace Tests\Feature;

use App\Models\Multiverse;
use App\Models\Saga;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\World;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorldosSimulationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(
            User::factory()->create(),
            ['*']
        );
        $this->seedCosmology();
    }

    protected function seedCosmology(): void
    {
        $mv = Multiverse::create(['name' => 'Test', 'slug' => 'test', 'config' => []]);
        $world = World::create([
            'multiverse_id' => $mv->id,
            'name' => 'Test World',
            'slug' => 'test-world',
            'axiom' => [],
            'world_seed' => [],
            'origin' => 'generic',
        ]);
        $saga = Saga::create(['world_id' => $world->id, 'name' => 'Test Saga', 'status' => 'active']);
        Universe::create([
            'world_id' => $world->id,
            'saga_id' => $saga->id,
            'multiverse_id' => $mv->id,
            'current_tick' => 0,
            'status' => 'active',
        ]);
    }

    public function test_simulation_advance_returns_ok_and_saves_snapshot(): void
    {
        $universe = Universe::firstOrFail();
        $response = $this->postJson('/api/worldos/simulation/advance', [
            'universe_id' => $universe->id,
            'ticks' => 2,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $this->assertArrayHasKey('snapshot', $response->json());

        $snapshot = UniverseSnapshot::where('universe_id', $universe->id)->latest('tick')->first();
        $this->assertNotNull($snapshot);
    }

    public function test_world_pulse_returns_ok(): void
    {
        $world = World::firstOrFail();
        $response = $this->postJson("/api/worldos/worlds/{$world->id}/pulse", [
            'ticks_per_universe' => 3,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonStructure(['results']);
    }

    public function test_advance_rejects_invalid_input(): void
    {
        $response = $this->postJson('/api/worldos/simulation/advance', [
            'universe_id' => 0,
            'ticks' => 1,
        ]);
        $response->assertStatus(422);
    }
}
