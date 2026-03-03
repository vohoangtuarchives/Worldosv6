<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * ObserverStabilityService: Implements the 'Quantum Observer Effect' (§V19).
 * The Architect's attention (viewing) stabilizes realities.
 */
class ObserverStabilityService
{
    /**
     * Calculate and apply the stability bonus from the Architect's gaze.
     */
    public function applyGaze(Universe $universe): void
    {
        $lastObserved = $universe->last_observed_at;
        
        if (!$lastObserved) {
            $universe->update(['observer_bonus' => 0.0]);
            return;
        }

        $now = now();
        $diffSeconds = $now->diffInSeconds($lastObserved);

        // Bonus scales inversely with time since last observation
        // Peak bonus: +0.1 SCI if observed within 60 seconds
        $bonus = max(0.0, 0.1 * (1.0 - ($diffSeconds / 600.0))); // Decays over 10 minutes

        $universe->update(['observer_bonus' => $bonus]);
        
        if ($bonus > 0.05) {
            Log::info("GAZE: Universe #{$universe->id} is stabilized by the Architect's Gaze (+{$bonus} SCI).");
        }
    }
}
