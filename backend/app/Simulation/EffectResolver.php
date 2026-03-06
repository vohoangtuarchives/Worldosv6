<?php

namespace App\Simulation;

use App\Simulation\Contracts\Effect;
use App\Simulation\Domain\WorldState;
use App\Simulation\Domain\WorldStateMutable;

/**
 * Applies a list of effects to a mutable copy of WorldState and returns the resulting WorldState.
 */
final class EffectResolver
{
    /**
     * @param Effect[] $effects
     */
    public function resolve(WorldState $state, array $effects): WorldState
    {
        $mutable = WorldStateMutable::fromWorldState($state);
        foreach ($effects as $effect) {
            $effect->apply($mutable);
        }
        return $mutable->toWorldState();
    }
}
