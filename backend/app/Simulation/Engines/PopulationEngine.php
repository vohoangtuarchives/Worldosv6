<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §7.1: Population Engine stub. cohort, fertility/mortality.
 */
final class PopulationEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'ecology';
    }

    public function name(): string
    {
        return 'population';
    }

    public function priority(): int
    {
        return 12;
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
