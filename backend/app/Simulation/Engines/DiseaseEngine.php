<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §7.3: Disease Engine stub. SIR model, pandemic severity.
 */
final class DiseaseEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'disease';
    }

    public function priority(): int
    {
        return 14;
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
