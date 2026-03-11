<?php

namespace App\Services\Narrative;

use App\Models\Myth;

/**
 * Detects when a Myth is a seed for a new Religion (myth_type=religion or impact above threshold).
 */
class ReligionSeedDetector
{
    protected float $impactThreshold;

    public function __construct(?float $impactThreshold = null)
    {
        $this->impactThreshold = $impactThreshold ?? (float) config('worldos.narrative.religion_impact_threshold', 0.6);
    }

    /**
     * Return true if this myth should seed a religion.
     */
    public function isReligionSeed(Myth $myth): bool
    {
        if ($myth->myth_type === 'religion') {
            return true;
        }
        return ($myth->impact ?? 0) >= $this->impactThreshold;
    }
}
