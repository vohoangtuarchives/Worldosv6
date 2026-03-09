<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

/**
 * doc §10.1: Knowledge Propagation Engine stub. knowledge node, graph, innovation_rate.
 */
final class KnowledgePropagationEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'knowledge_propagation';
    }

    public function priority(): int
    {
        return 19;
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
