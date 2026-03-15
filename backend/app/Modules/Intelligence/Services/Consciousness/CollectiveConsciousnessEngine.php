<?php

namespace App\Modules\Intelligence\Services\Consciousness;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
use App\Simulation\SimulationEventBus;
use Illuminate\Support\Facades\Log;

/**
 * Collective Consciousness Engine (Phase 43)
 * 
 * Calculates the resonance_field from actor activities and applies consciousness-based reality warping.
 */
class CollectiveConsciousnessEngine
{
    public function __construct(
        protected RuleVmService $ruleVm,
        protected SimulationEventBus $eventBus
    ) {}

    public function runWithState(WorldState $state, int $tick): void
    {
        $actors = $state->getActorEntities();
        $alive = array_filter($actors, fn($a) => $a->isAlive);
        if (empty($alive)) {
            $state->set('resonance_field', 0.0);
            return;
        }

        // 1. Calculate base resonance from actor coherence
        $resonance = $this->calculateCollectiveResonance($alive);
        $state->set('resonance_field', $resonance);

        // 2. Evaluate Consciousness DSL for Reality Warping
        $dslPath = resource_path('worldos_rules/simulation/consciousness.dsl');
        if (file_exists($dslPath)) {
            $dsl = file_get_contents($dslPath);
            // Build VM state for global consciousness evaluation
            $vmState = array_merge($state->toArray(), [
                'field_resonance_field' => $resonance,
                'alive_actor_count'     => count($alive)
            ]);

            $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);
        }

        if ($resonance > 0.8) {
            Log::info("CollectiveConsciousness: High resonance detected ({$resonance}) for Universe " . $state->get('universe_id'));
        }
    }

    protected function calculateCollectiveResonance(array $actors): float
    {
        // Simple heuristic: alignment of 'meaning' and 'belonging' memes across population
        $totalResonance = 0.0;
        foreach ($actors as $actor) {
            $metrics = $actor->metrics ?? [];
            $meaning = $metrics['meme_meaning'] ?? 0.5;
            $belonging = $metrics['meme_belonging'] ?? 0.5;
            $totalResonance += ($meaning + $belonging) / 2.0;
        }

        return round($totalResonance / count($actors), 4);
    }
}
