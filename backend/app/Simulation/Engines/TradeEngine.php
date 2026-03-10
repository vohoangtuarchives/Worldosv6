<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §8.5: Trade & Economy Engine stub. market price, trade route.
 */
final class TradeEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'economy';
    }

    public function name(): string
    {
        return 'trade';
    }

    public function priority(): int
    {
        return 18;
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
