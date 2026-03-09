<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §7.2: Migration Engine stub. migration types, flow object.
 */
final class MigrationEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'migration';
    }

    public function priority(): int
    {
        return 13;
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
