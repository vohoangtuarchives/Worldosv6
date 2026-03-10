<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Support\SimulationRandom;

/**
 * Evolves world_rules (Tier 2 mutable rules) under pressure with inertia.
 * With low probability, nudges a rule value; high inertia reduces mutation chance.
 */
final class LawEvolutionEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'politics';
    }

    private const MUTATION_CHANCE_BASE = 0.02;
    private const NUDGE_MAGNITUDE = 0.03;
    /** Keys that can be mutated (numeric drift) */
    private const MUTABLE_KEYS = ['entropy_tendency', 'order_tendency', 'innovation_tendency'];

    public function name(): string
    {
        return 'law_evolution';
    }

    public function priority(): int
    {
        return 6;
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.law_evolution') ?? 20));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rng = new SimulationRandom($ctx->getSeed(), $ctx->getTick(), 0);
        $effects = $this->evaluate($state, $rng);
        $events = [];
        if ($effects !== []) {
            $events[] = WorldEvent::create(
                WorldEventType::WORLD_RULES_MUTATED,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.25,
                [],
                ['trigger' => 'law_evolution']
            );
        }
        return new EngineResult($events, $effects, []);
    }

    /**
     * @return \App\Simulation\Contracts\Effect[]
     */
    private function evaluate(WorldState $state, SimulationRandom $rng): array
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
