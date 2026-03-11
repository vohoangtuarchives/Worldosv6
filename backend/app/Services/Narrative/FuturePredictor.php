<?php

namespace App\Services\Narrative;

use App\Models\UniverseSnapshot;

/**
 * Builds a structured summary from state vector / snapshot for prophecy prompt.
 */
class FuturePredictor
{
    /**
     * @param  array<string, mixed>  $stateVector
     */
    public function summarizeState(int $tick, array $stateVector): string
    {
        $entropy = (float) ($stateVector['entropy'] ?? 0.5);
        $fields = (array) ($stateVector['fields'] ?? []);
        $stability = (float) ($fields['stability'] ?? $stateVector['sci'] ?? 0.5);
        $power = (float) ($fields['power'] ?? 0.5);
        $tension = $entropy > 0.6 ? 'high' : ($entropy > 0.3 ? 'moderate' : 'low');

        return "Tick {$tick}: entropy={$entropy}, stability={$stability}, power={$power}. Tension: {$tension}.";
    }

    /**
     * Get state summary from latest snapshot for universe.
     */
    public function summarizeFromSnapshot(UniverseSnapshot $snapshot): string
    {
        $vec = (array) ($snapshot->state_vector ?? []);
        return $this->summarizeState((int) $snapshot->tick, $vec);
    }
}
