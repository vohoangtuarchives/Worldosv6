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

        // Resilience (trait 10), Longevity (17). Thể chất: dùng vector huyết mạch metrics['physic'] (aggregate) nếu có.
        $resilience = max(0, min(1, (float) ($state->traits['resilience'] ?? $state->traits[10] ?? 0.5)));
        $longevity = max(0, min(1, (float) ($state->traits['longevity'] ?? $state->traits['Longevity'] ?? $state->traits[17] ?? 0.5)));
        $physicAggregate = $this->aggregatePhysic($state->metrics['physic'] ?? null);
        // Xác suất sống: resilience + longevity + thể chất (huyết mạch) + (1-entropy)
        $logit = $resilience * 0.35 + $longevity * 0.15 + $physicAggregate * 0.15 + (1 - $entropy) * 0.35;
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
     * Aggregate physic vector (huyết mạch) to a single scalar for survival.
     * metrics['physic'] = array of floats [0..1] theo PHYSIC_DIMENSIONS.
     */
    private function aggregatePhysic(?array $physic): float
    {
        if ($physic === null || $physic === []) {
            return 0.5;
        }
        $vals = array_values($physic);
        $sum = 0.0;
        $n = 0;
        foreach ($vals as $v) {
            if (is_numeric($v)) {
                $sum += max(0, min(1, (float) $v));
                $n++;
            }
        }
        return $n > 0 ? $sum / $n : 0.5;
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
