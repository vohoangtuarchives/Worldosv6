<?php

namespace App\Simulation\Effects;

use App\Simulation\Contracts\Effect;
use App\Simulation\Domain\WorldStateMutable;

/**
 * Anti-freeze: applies small entropy increase and/or order decrease to state_vector
 * so the simulation does not remain perfectly stable indefinitely.
 */
final class StructuralDecayEffect implements Effect
{
    public function __construct(
        private readonly float $entropyDelta = 0.0,
        private readonly float $orderDelta = 0.0,
    ) {
    }

    public function apply(WorldStateMutable $state): void
    {
        $vec = $state->getStateVector();
        if ($this->entropyDelta !== 0.0) {
            $entropy = (float) ($vec['entropy'] ?? 0);
            $vec['entropy'] = max(0, min(1.0, $entropy + $this->entropyDelta));
        }
        if ($this->orderDelta !== 0.0) {
            $order = (float) ($vec['order'] ?? 0);
            $vec['order'] = max(0, min(1.0, $order + $this->orderDelta));
        }
        $state->setStateVector($vec);
    }
}
