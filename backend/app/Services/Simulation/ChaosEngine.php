<?php

namespace App\Services\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * ChaosEngine: Unbridled Probability Manager (§V25).
 * Introduces core logic destabilization for 'chaotic' worlds.
 */
class ChaosEngine
{
    /**
     * Determine if a chaotic override should happen this tick.
     */
    public function destabilize(Universe $universe): void
    {
        $world = $universe->world;

        // Only apply to chaotic worlds
        if (!$world || !$world->is_chaotic) {
            return;
        }

        // Extremely low chance to break reality per tick (0.01%)
        if (rand(0, 10000) > 1) {
            return;
        }

        $this->triggerParadox($universe);
    }

    protected function triggerParadox(Universe $universe): void
    {
        // Pick a random paradox
        $paradoxes = ['entropy_inversion', 'sci_singularity', 'zone_collapse'];
        $paradox = $paradoxes[array_rand($paradoxes)];

        switch ($paradox) {
            case 'entropy_inversion':
                // Swap SCI and Entropy
                $temp = $universe->structural_coherence;
                $universe->structural_coherence = $universe->entropy;
                $universe->entropy = $temp;
                break;
            
            case 'sci_singularity':
                // Temporarily force SCI to impossible levels
                $universe->structural_coherence = 1.5; // Breaking the 1.0 boundary
                break;

            case 'zone_collapse':
                // Wipe radiation from all zones unpredictably
                $vec = $universe->state_vector;
                if (isset($vec['zones'])) {
                    foreach ($vec['zones'] as &$zone) {
                        $zone['state']['radiation'] = 0;
                        $zone['state']['vitality'] = 1.0;
                    }
                    $universe->state_vector = $vec;
                }
                break;
        }

        $universe->save();

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'to_tick' => $universe->current_tick,
            'type' => 'chaos_anomaly',
            'raw_payload' => [
                'action' => 'paradox_triggered',
                'paradox_type' => $paradox,
                'impact' => 'massive_reality_warp'
            ],
        ]);

        Log::warning("CHAOS MATRIX: Reality fractured in Universe #{$universe->id}. Type: {$paradox}");
    }
}
