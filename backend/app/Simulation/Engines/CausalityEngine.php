<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §12.1: Causality Engine — causal graph (Event A → Event B → Event C).
 * Pipeline representation; actual causality graph update is done by SyncWorldEventToCausalityGraph
 * when events are published (doc §4 event flow).
 */
final class CausalityEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'causality';
    }

    public function priority(): int
    {
        return 100;
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
