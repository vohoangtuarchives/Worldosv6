<?php

namespace App\Simulation\Contracts;

use App\Simulation\Domain\WorldState;
use App\Simulation\Support\SimulationRandom;

interface SimulationEngine
{
    /**
     * Evaluate current state and return effects to apply. Must not mutate DB or snapshot.
     *
     * @return Effect[]
     */
    public function evaluate(WorldState $state, SimulationRandom $rng): array;
}
