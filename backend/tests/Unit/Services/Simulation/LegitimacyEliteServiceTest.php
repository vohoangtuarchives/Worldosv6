<?php

namespace Tests\Unit\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Services\Simulation\LegitimacyEliteService;
use Illuminate\Support\Facades\Config;
use Mockery;
use Tests\TestCase;

class LegitimacyEliteServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_skips_when_tick_not_on_interval(): void
    {
        Config::set('worldos.intelligence.politics_tick_interval', 25);

        $universeRepo = Mockery::mock(UniverseRepositoryInterface::class);
        $universeRepo->shouldNotReceive('update');

        $universe = new Universe(['state_vector' => []]);
        $universe->id = 1;

        $service = new LegitimacyEliteService($universeRepo);
        $service->evaluate($universe, 10);
        $this->addToAssertionCount(1);
    }

}
