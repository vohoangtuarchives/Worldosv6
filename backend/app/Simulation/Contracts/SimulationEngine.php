<?php

namespace App\Simulation\Contracts;

use App\Simulation\Domain\WorldState;
use App\Simulation\Support\SimulationRandom;

interface SimulationEngine
{
    /**
     * Run this engine every N ticks. 1 = every tick, 10 = every 10th tick.
     * Used by Simulation Kernel scheduler.
     */
    public function tickRate(): int;

    /**
     * Evaluate current state and return effects to apply. Must not mutate DB or snapshot.
     *
     * @return Effect[]
     */
    public function evaluate(WorldState $state, SimulationRandom $rng): array;
}
