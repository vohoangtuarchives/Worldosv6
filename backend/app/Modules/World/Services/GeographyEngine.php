<?php

namespace App\Modules\World\Services;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * World layer (Physical): geography / planet-level placeholder (doc §17).
 * No-op for now; future: climate, terrain, disasters.
 */
final class GeographyEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'physical';
    }

    public function name(): string
    {
        return 'geography';
    }

    public function priority(): int
    {
        return 0;
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
