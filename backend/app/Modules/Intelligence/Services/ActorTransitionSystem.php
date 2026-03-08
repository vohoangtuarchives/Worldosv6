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
     * Includes a small baseline mortality per tick so that over many ticks some actors eventually perish.
     */
    public function processSurvival(ActorState $state, float $entropy, SimulationRng $rng): ActorState
    {
        if (!$state->isAlive) {
            return $state;
        }

        // Resilience: support both named key and numeric trait index (ActorEntity default traits use 0..16)
        $resilience = $state->traits['resilience'] ?? $state->traits[10] ?? 0.5;
        $resilience = max(0, min(1, (float) $resilience));

        // Probability of survival (logistic): higher resilience + lower entropy => higher survival
        $logit = $resilience * 0.6 + (1 - $entropy) * 0.4;
        $prob = 1 / (1 + exp(-$logit));

        // Baseline mortality per tick (~1.5%) để luôn có một phần actor chết theo thời gian
        $baselineDeathChance = 0.015;
        $prob = $prob * (1 - $baselineDeathChance);

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
