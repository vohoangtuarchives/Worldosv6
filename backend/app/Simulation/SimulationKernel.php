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
    /** @var SimulationEngine[] */
    private array $engines = [];

    public function __construct(
        private readonly EffectResolver $effectResolver,
    ) {
    }

    /**
     * Register an engine. Tick rate is read from engine->tickRate() (run when tick % tickRate() === 0).
     */
    public function registerEngine(SimulationEngine $engine): void
    {
        $this->engines[] = $engine;
    }

    public function runTick(WorldState $state, SimulationRandom $rng): WorldState
    {
        $tick = $state->getTick();
        $allEffects = [];
        foreach ($this->engines as $engine) {
            $factor = $engine->tickRate();
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
