<?php

namespace App\Simulation;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\WorldState;
use App\Simulation\Support\SimulationRandom;

/**
 * Simulation Kernel: runs registered engines in order, collects effects, resolves them, returns new WorldState.
 * Time-scale: each engine has a tick factor; it runs only when tick % factor === 0 (factor 1 = every tick).
 * Deterministic when using same seed + tick.
 */
final class SimulationKernel
{
    /** @var array{0: SimulationEngine, 1: int}[] */
    private array $engines = [];

    public function __construct(
        private readonly EffectResolver $effectResolver,
    ) {
    }

    /**
     * Register an engine to run every $tickFactor ticks (1 = every tick, 10 = every 10th tick).
     */
    public function registerEngine(SimulationEngine $engine, int $tickFactor = 1): void
    {
        $this->engines[] = [$engine, $tickFactor];
    }

    public function runTick(WorldState $state, SimulationRandom $rng): WorldState
    {
        $tick = $state->getTick();
        $allEffects = [];
        foreach ($this->engines as [$engine, $factor]) {
            if ($factor < 1 || ($tick % $factor) !== 0) {
                continue;
            }
            $effects = $engine->evaluate($state, $rng);
            foreach ($effects as $effect) {
                $allEffects[] = $effect;
            }
        }
        return $this->effectResolver->resolve($state, $allEffects);
    }
}
