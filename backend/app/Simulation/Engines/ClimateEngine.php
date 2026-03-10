<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §6.2: Climate Engine stub. Long-term cycles, agriculture impact.
 * Full logic in PlanetaryClimateEngine (called from AdvanceSimulationAction).
 */
final class ClimateEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'climate';
    }

    public function name(): string
    {
        return 'climate';
    }

    public function priority(): int
    {
        return 2;
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
