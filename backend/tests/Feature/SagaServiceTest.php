<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\Saga\SagaService;
use App\Services\Simulation\UniverseRuntimeService;
use App\Models\World;
use App\Models\Universe;
use App\Models\Multiverse;
use App\Services\Simulation\OriginSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class SagaServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_spawn_universe_creates_universe_with_implicit_saga()
    {
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
            'origin' => 'generic',
            'global_tick' => 0,
        ]);

        $runtime = Mockery::mock(UniverseRuntimeService::class);
        $originSeeder = Mockery::mock(OriginSeeder::class);
        $originSeeder->shouldReceive('seed')->byDefault();

        $service = new SagaService($runtime, $originSeeder);

        $universe = $service->spawnUniverse($world);

        $this->assertEquals($world->id, $universe->world_id);
        $this->assertNotNull($universe->saga_id);
        $this->assertEquals('active', $universe->status);
    }
}
