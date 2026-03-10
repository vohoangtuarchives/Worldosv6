<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §11.1: Psychology Engine stub. agent model, social contagion.
 */
final class PsychologyEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string
    {
        return 'psychology';
    }

    public function priority(): int
    {
        return 23;
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
