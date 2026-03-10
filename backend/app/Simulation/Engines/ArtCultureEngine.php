<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §9.3: Art & Culture Engine stub. cultural_output, movement.
 */
final class ArtCultureEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'culture';
    }

    public function name(): string
    {
        return 'art_culture';
    }

    public function priority(): int
    {
        return 22;
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
