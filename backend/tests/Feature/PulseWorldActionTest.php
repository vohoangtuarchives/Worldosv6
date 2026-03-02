<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Actions\Simulation\PulseWorldAction;
use App\Services\Simulation\UniverseRuntimeService;
use App\Models\World;
use App\Models\Universe;
use App\Models\Multiverse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class PulseWorldActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_pulse_world_action_advances_all_active_universes()
    {
        // 1. Setup Data
        $multiverse = Multiverse::create([
            'name' => 'Test Multiverse',
            'slug' => 'test-multiverse',
            'config' => []
        ]);
        $world = World::create([
            'multiverse_id' => $multiverse->id,
            'name' => 'Test World',
            'slug' => 'test-world',
            'status' => 'active',
            'axiom' => [],
            'world_seed' => [],
            'origin' => 'generic'
        ]);

        $u1 = Universe::create([
            'world_id' => $world->id,
            'multiverse_id' => $multiverse->id,
            'name' => 'Universe 1',
            'status' => 'active',
            'current_tick' => 0,
            'state_vector' => []
        ]);

        $u2 = Universe::create([
            'world_id' => $world->id,
            'multiverse_id' => $multiverse->id,
            'name' => 'Universe 2',
            'status' => 'active',
            'current_tick' => 0,
            'state_vector' => []
        ]);

        // 2. Mock Runtime Service
        $runtime = Mockery::mock(UniverseRuntimeService::class);
        $runtime->shouldReceive('advance')
            ->with($u1->id, 10)
            ->once()
            ->andReturn(['ok' => true]);
        
        $runtime->shouldReceive('advance')
            ->with($u2->id, 10)
            ->once()
            ->andReturn(['ok' => true]);

        // 3. Run Action
        $action = new PulseWorldAction($runtime);
        $results = $action->execute($world, 10);

        // 4. Assertions
        $this->assertCount(2, $results);
        $this->assertTrue($results[$u1->id]['ok']);
        $this->assertTrue($results[$u2->id]['ok']);
    }
}
