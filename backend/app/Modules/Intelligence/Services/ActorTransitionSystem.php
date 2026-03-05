<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Entities\ActorState;
use App\Modules\Intelligence\Domain\Rng\SimulationRng;
use App\Modules\Intelligence\Domain\Entropy\EntropyBudget;

/**
 * Pure functions to transition ActorState based on Simulation Engine inputs.
 * Strictly adheres to Determinism by exclusively using SimulationRng and EntropyBudget.
 */
class ActorTransitionSystem
{
    /**
     * Drift traits smoothly logic using deterministic RNG.
     */
    public function driftTraits(
        ActorState $state,
        SimulationRng $rng,
        EntropyBudget $budget,
        array $socialField = [],
        float $variance = 0.02
    ): ActorState {
        if (!$state->isAlive) {
            return $state;
        }

        $newTraits = $state->traits;
        foreach ($newTraits as $key => $val) {
            // Replaces rand(-100, 100) / 100.0 with deterministic RNG
            // e.g nextFloat returns [0, 1), we map it to [-1, 1]
            $drift = ($rng->nextFloat() * 2 - 1) * $variance;
            $newTraits[$key] = max(0, min(1, $val + $drift));
        }

        return $state->with(['traits' => $newTraits]);
    }

    /**
     * Survival check using logistic probability against state and entropy.
     */
    public function processSurvival(ActorState $state, float $entropy, SimulationRng $rng): ActorState
    {
        if (!$state->isAlive) {
            return $state;
        }

        $resilience = $state->traits['resilience'] ?? 0.5; // Example surrogate
        
        // Probability of survival formula (Logistic)
        $prob = 1 / (1 + exp(-($resilience * 0.6 + (1 - $entropy) * 0.4)));

        if ($rng->nextFloat() > $prob) {
            return $state->with(['isAlive' => false]);
        }

        return $state;
    }

    /**
     * Updates traits directly from successful actions.
     */
    public function evolveTraits(ActorState $state, array $successfulActions): ActorState
    {
        if (!$state->isAlive) {
            return $state;
        }

        $newTraits = $state->traits;
        foreach ($successfulActions as $action) {
            $trait = $this->mapActionToTrait($action);
            if ($trait) {
                $newTraits[$trait] = min(1.0, ($newTraits[$trait] ?? 0.1) + 0.05);
            }
        }

        return $state->with(['traits' => $newTraits]);
    }

    private function mapActionToTrait(string $action): ?string
    {
        return match($action) {
            'combat' => 'strength',
            'research' => 'intelligence',
            'trade' => 'charisma',
            default => null
        };
    }
}
