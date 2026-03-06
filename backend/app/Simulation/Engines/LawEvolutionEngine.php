<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Simulation\Support\SimulationRandom;

/**
 * Evolves world_rules (Tier 2 mutable rules) under pressure with inertia.
 * With low probability, nudges a rule value; high inertia reduces mutation chance.
 */
final class LawEvolutionEngine implements SimulationEngine
{
    private const MUTATION_CHANCE_BASE = 0.02;
    private const NUDGE_MAGNITUDE = 0.03;
    /** Keys that can be mutated (numeric drift) */
    private const MUTABLE_KEYS = ['entropy_tendency', 'order_tendency', 'innovation_tendency'];

    public function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $vec = $state->getStateVector();
        $rules = $vec['world_rules'] ?? [];
        if (!is_array($rules)) {
            $rules = [];
        }

        $inertia = (float) ($rules['_inertia'] ?? 0.85);
        $roll = $rng->float(0, 1);
        if ($roll >= (self::MUTATION_CHANCE_BASE * (1.0 - $inertia))) {
            return [];
        }

        $key = self::MUTABLE_KEYS[$rng->int(0, count(self::MUTABLE_KEYS) - 1)];
        $current = (float) ($rules[$key] ?? 0.5);
        $nudge = ($rng->float(0, 1) > 0.5 ? 1 : -1) * self::NUDGE_MAGNITUDE;
        $newVal = max(0.0, min(1.0, $current + $nudge));

        return [new WorldRulesUpdateEffect([$key => $newVal])];
    }
}
