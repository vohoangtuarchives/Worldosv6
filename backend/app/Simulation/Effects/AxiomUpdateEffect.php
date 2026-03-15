<?php

namespace App\Simulation\Effects;

use App\Simulation\Contracts\Effect;
use App\Simulation\Runtime\State\WorldStateMutable;

/**
 * AxiomUpdateEffect: Merges updated axioms into state_vector.
 */
final class AxiomUpdateEffect implements Effect
{
    /** @param array<string, mixed> $axioms key => value to merge into state_vector.axioms */
    public function __construct(
        private readonly array $axioms,
    ) {
    }

    public function apply(WorldStateMutable $state): void
    {
        $vec = $state->getStateVector();
        $current = $vec['axioms'] ?? [];
        if (!is_array($current)) {
            $current = [];
        }
        $vec['axioms'] = array_merge($current, $this->axioms);
        $state->setStateVector($vec);
    }
}
