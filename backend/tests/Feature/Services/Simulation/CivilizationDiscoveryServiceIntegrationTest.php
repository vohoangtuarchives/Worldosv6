<?php

namespace Tests\Feature\Services\Simulation;

use App\Models\Multiverse;
use App\Models\Saga;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\World;
use App\Services\Simulation\CivilizationDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CivilizationDiscoveryServiceIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Config::set('worldos.civilization_discovery.fitness_interval', 10);
    }

    protected function createUniverse(): Universe
    {
        $mv = Multiverse::create(['name' => 'Test', 'slug' => 'test-mv', 'config' => []]);
        $world = World::create([
            'multiverse_id' => $mv->id,
            'name' => 'Test World',
            'slug' => 'test-world',
            'axiom' => [],
            'world_seed' => [],
            'origin' => 'generic',
            'global_tick' => 0,
        ]);
        $saga = Saga::create(['world_id' => $world->id, 'name' => 'Test Saga', 'status' => 'active']);
        return Universe::create([
            'world_id' => $world->id,
            'saga_id' => $saga->id,
            'multiverse_id' => $mv->id,
            'current_tick' => 0,
            'status' => 'active',
            'state_vector' => [
                'civilization' => [
                    'economy' => ['total_surplus' => 50, 'total_consumption' => 30],
                    'settlements' => [['population' => 100]],
                ],
                'innovation' => 0.4,
                'stability_index' => 0.7,
            ],
        ]);
    }

    public function test_writes_discovery_fitness_on_interval(): void
    {
        $universe = $this->createUniverse();
        $snapshot = UniverseSnapshot::create([
            'universe_id' => $universe->id,
            'tick' => 10,
            'state_vector' => $universe->state_vector,
            'entropy' => 0.5,
            'stability_index' => 0.7,
            'metrics' => [],
        ]);
        $service = app(CivilizationDiscoveryService::class);
        $service->evaluate($universe, 10, $snapshot);
        $universe->refresh();
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        $this->assertArrayHasKey('civilization', $sv);
        $this->assertArrayHasKey('discovery', $sv['civilization']);
        $discovery = $sv['civilization']['discovery'];
        $this->assertArrayHasKey('fitness', $discovery);
        $this->assertArrayHasKey('updated_tick', $discovery);
        $this->assertSame(10, $discovery['updated_tick']);
        $this->assertIsNumeric($discovery['fitness']);
        $this->assertGreaterThanOrEqual(0, (float) $discovery['fitness']);
    }
}
