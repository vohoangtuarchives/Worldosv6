<?php

namespace App\Contracts;

/**
 * doc §4, §12: causality graph update in event flow.
 * Records event chains (Event A → Event B → Event C) per universe for narrative/causal analysis.
 */
interface CausalityGraphServiceInterface
{
    /**
     * Record an event and its causal link to the previous event for the universe.
     */
    public function recordEvent(int $universeId, string $eventId, string $type, int $tick): void;
}
