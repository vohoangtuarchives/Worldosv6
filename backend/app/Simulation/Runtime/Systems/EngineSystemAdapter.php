<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;

/**
 * EngineSystemAdapter – Wraps Engines (including SimulationEngine interface)
 * 
 * Allows engines to be orchestrated by the WorldKernel.
 */
class EngineSystemAdapter implements WorldSystemInterface
{
    protected object $engine;

    public function __construct(object $engine)
    {
        $this->engine = $engine;
    }

    public function update(array $context, int $tick): ?ImpactReport
    {
        // Capture system metadata for reporting
        $report = new ImpactReport(get_class($this->engine), 'Hybrid', 'Engine');

        // Engines need WorldState. We create a temporary one from context.
        $state = WorldState::fromArray($context);

        if ($this->engine instanceof SimulationEngine) {
            $universeId = (int) ($context['state']['universe_id'] ?? 0);
            $seed = (int) ($context['state']['seed'] ?? 0);
            $ctx = new TickContext($universeId, $tick, $seed);
            
            $result = $this->engine->handle($state, $ctx);
            
            // Map Effects to mutations in ImpactReport so WorldKernel can apply them
            foreach ($result->stateChanges as $effect) {
                // If it's a WorldRulesUpdateEffect, we can extract mutations
                if ($effect instanceof \App\Simulation\Effects\WorldRulesUpdateEffect) {
                    $report->log(
                        'Engine', $this->engine->name(),
                        'mutates',
                        'WorldState', 'global',
                        1.0, 1.0,
                        ['mutation' => $effect->getChanges()]
                    );
                } else {
                    // Fallback: apply effect to our local state and report it as a generic mutation
                    // Note: This relies on most effects being simple mutations for WorldKernel.
                    $effect->apply($state);
                    $report->log('Engine', $this->engine->name(), 'applied_effect', 'Effect', get_class($effect));
                }
            }
            
            // Mapping events to impacts if needed (WorldKernel has its own event bus handling usually)
            return $report->hasImpacts() ? $report : null;
        }

        // Legacy support
        if (method_exists($this->engine, 'run')) {
            $this->engine->run($state, $tick);
            $report->log('Engine', get_class($this->engine), 'legacy_run', 'WorldState', 'global');
            return $report;
        } elseif (method_exists($this->engine, 'update')) {
            $this->engine->update($state, $tick);
            $report->log('Engine', get_class($this->engine), 'legacy_update', 'WorldState', 'global');
            return $report;
        }

        return null; 
    }
}
