<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Concerns\HasProductTypes;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §8.1: Civilization Formation Engine stub. cities >= 3, shared language/culture, stages.
 */
final class CivilizationFormationEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;
    use HasProductTypes;

    public function productTypes(): array
    {
        return ['factions', 'civilizations'];
    }

    public function phase(): string
    {
        return 'social';
    }

    public function name(): string
    {
        return 'civilization_formation';
    }

    public function priority(): int
    {
        return 15;
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
