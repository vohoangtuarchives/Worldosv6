<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §6.3: Agriculture Engine stub. food_production, food_required, famine, tech stages.
 */
final class AgricultureEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'economy';
    }

    public function name(): string
    {
        return 'agriculture';
    }

    public function priority(): int
    {
        return 11;
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
