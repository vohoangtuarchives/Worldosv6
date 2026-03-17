<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use function resource_path;
use function file_get_contents;

/**
 * doc §10.1: Knowledge Propagation Engine stub. knowledge node, graph, innovation_rate.
 */
final class KnowledgePropagationEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'meta';
    }

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

    public function __construct(
        protected \App\Services\Simulation\RuleVmService $ruleVm,
    ) {}

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rawState = $state->getStateVector();
        $rawState['tick'] = $ctx->getTick();
        
        $dslFile = \resource_path('worldos_rules/ideology/propagation.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';
        
        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        if (! ($result['ok'] ?? false)) {
            return EngineResult::empty();
        }

        // Apply knowledge increments to state via effects if needed
        return EngineResult::empty();
    }
}
