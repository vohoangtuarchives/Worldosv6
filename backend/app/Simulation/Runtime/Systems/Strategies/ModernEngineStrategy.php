<?php

namespace App\Simulation\Runtime\Systems\Strategies;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;
use App\Simulation\Runtime\Systems\Strategies\EngineAdapterStrategyInterface;

/**
 * Strategy dành cho các Engine thế hệ mới (implement SimulationEngine interface).
 */
class ModernEngineStrategy implements EngineAdapterStrategyInterface
{
    public function canHandle(object $engine): bool
    {
        return $engine instanceof SimulationEngine;
    }

    public function execute(object $engine, array $context, int $tick, WorldState $state, ImpactReport $report): void
    {
        $universeId = (int) ($context['state']['universe_id'] ?? 0);
        $seed = (int) ($context['state']['seed'] ?? 0);
        $ctx = new TickContext($universeId, $tick, $seed);
        
        $result = $engine->handle($state, $ctx);
        
        foreach ($result->stateChanges as $effect) {
            if ($effect instanceof \App\Simulation\Effects\WorldRulesUpdateEffect) {
                $report->log('Engine', $engine->name(), 'mutates', 'WorldState', 'global', 1.0, 1.0, ['mutation' => $effect->getRules()]);
            } elseif (is_object($effect)) {
                $effect->apply($state);
                $report->log('Engine', $engine->name(), 'applied_effect', 'Effect', get_class($effect));
            } elseif (is_array($effect)) {
                foreach ($effect as $k => $v) { $state->set($k, $v); }
                $report->log('Engine', $engine->name(), 'applied_raw_mutation', 'Array', json_encode($effect));
            }
        }
    }
}
