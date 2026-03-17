<?php

namespace App\Simulation\Effects;

use App\Simulation\Contracts\Effect;
use App\Simulation\Runtime\State\WorldStateMutable;

/**
 * Phase 5: General purpose state vector update effect.
 * Replaces direct $state->set() calls in Pure Engines.
 */
final class WorldStateUpdateEffect implements Effect
{
    /**
     * @param array<string, mixed> $changes Key-value pairs where keys can use dot-notation.
     */
    public function __construct(
        private readonly array $changes,
    ) {
    }

    public function apply(WorldStateMutable $state): void
    {
        foreach ($this->changes as $key => $value) {
            $state->set($key, $value);
        }
    }
}
