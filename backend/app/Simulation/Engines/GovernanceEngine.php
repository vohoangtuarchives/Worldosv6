<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §8.3: Empire Governance Engine stub. stability, collapse.
 */
final class GovernanceEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'governance';
    }

    public function priority(): int
    {
        return 17;
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
