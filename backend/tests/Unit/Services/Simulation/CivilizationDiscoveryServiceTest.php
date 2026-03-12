<?php

namespace Tests\Unit\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Services\Simulation\CivilizationDiscoveryService;
use App\Services\Saga\SagaService;
use Illuminate\Support\Facades\Config;
use Mockery;
use Tests\TestCase;

class CivilizationDiscoveryServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_skips_when_tick_not_on_interval(): void
    {
        Config::set('worldos.civilization_discovery.fitness_interval', 10);
        $universeRepo = Mockery::mock(UniverseRepositoryInterface::class);
        $universeRepo->shouldNotReceive('update');
        $sagaService = Mockery::mock(SagaService::class);
        $universe = new Universe(['state_vector' => ['civilization' => ['economy' => []]]]);
        $universe->id = 1;
        $service = new CivilizationDiscoveryService($universeRepo, $sagaService);
        $service->evaluate($universe, 5, null);
        $this->addToAssertionCount(1);
    }

    public function test_fitness_returns_positive_value(): void
    {
        $universeRepo = Mockery::mock(UniverseRepositoryInterface::class);
        $sagaService = Mockery::mock(SagaService::class);
        $service = new CivilizationDiscoveryService($universeRepo, $sagaService);
        $fitness = $service->fitness(10.0, 0.05, 100.0, 0.8, 0.6);
        $this->assertGreaterThan(0, $fitness);
        $this->assertIsFloat($fitness);
    }
}
