<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §9.1: Religion Evolution Engine stub. formation, religion tree.
 */
final class ReligionEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'religion';
    }

    public function priority(): int
    {
        return 21;
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
