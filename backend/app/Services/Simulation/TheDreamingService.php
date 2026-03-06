<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Log;

/**
 * TheDreamingService: Manages the subconscious layer of the simulation (§V11).
 * Generates 'Whispers' based on physical tension (Trauma, Entropy) and Narrative resonance.
 */
class TheDreamingService
{
    /**
     * Generate whispers for a universe based on its latest snapshot.
     */
    public function generateWhispers(Universe $universe): array
    {
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        if (!$latest) return [];

        $zones = ($latest->state_vector ?? [])['zones'] ?? [];
        $whispers = [];

        foreach ($zones as $z) {
            $state = $z['state'] ?? [];
            $trauma = $state['trauma'] ?? 0.0;
            $entropy = $state['entropy'] ?? 0.0;
            $belief = $state['cultural']['myth_belief'] ?? 0.5;

            // Logic: High trauma + High belief = Nightmare Whispers
            if ($trauma > 0.7 && $belief > 0.6) {
                $whispers[] = [
                    'zone_id' => $z['id'],
                    'type' => 'nightmare',
                    'content' => "Tiếng khóc của sự sụp đổ vọng lại từ tương lai.",
                    'intensity' => $trauma * $belief
                ];
            }

            // Logic: Low entropy + High knowledge = Prophetic Whispers
            if ($entropy < 0.2 && ($state['embodied_knowledge'] ?? 0.0) > 0.8) {
                $whispers[] = [
                    'zone_id' => $z['id'],
                    'type' => 'prophecy',
                    'content' => "Ánh sáng của trí tuệ đang dệt nên một trật tự mới.",
                    'intensity' => (1.0 - $entropy) * ($state['embodied_knowledge'] ?? 0.0)
                ];
            }
        }

        return $whispers;
    }

    /**
     * Calculate Oneric Density for a zone.
     * High density makes the 'physics' soft and receptive to Mythic Resonance.
     */
    public function getOnericDensity(array $zoneState): float
    {
        $trauma = $zoneState['trauma'] ?? 0.0;
        $belief = $zoneState['cultural']['myth_belief'] ?? 0.0;
        return ($trauma * 0.4 + $belief * 0.6);
    }
}
