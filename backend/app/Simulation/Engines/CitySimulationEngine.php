<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §8.2: City Simulation Engine stub. city_id, population, economy, specialization.
 */
final class CitySimulationEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'city_simulation';
    }

    public function priority(): int
    {
        return 16;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        return EngineResult::empty();
    }
}
