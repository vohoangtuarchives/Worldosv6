<?php

namespace App\Modules\Intelligence\Services;

use App\Models\Universe;

class SocietyAnalyzer
{
    /**
     * Checks triggers for emergent faction formation based on archetype ratios
     * and fragmented scores. Returns array of Faction configurations to spawn.
     */
    public function detectEmergentFactions(array $archetypeRatios, float $fragmentedScore): array
    {
        $newFactions = [];

        // Check Warrior dominance
        $warriorRatio = $archetypeRatios['Chiến Binh'] ?? ($archetypeRatios['Warlord'] ?? 0.0);
        if ($warriorRatio > 0.4) {
            $newFactions[] = [
                'name' => 'Quân Phiệt ' . rand(100, 999), // Placeholder for actual name gen
                'type' => 'militaristic',
                'description' => 'Một thế lực quân phiệt trỗi dậy từ sự áp đảo của các chiến binh.',
                'bias' => ['battle' => 1.5, 'trade' => 0.6]
            ];
        }

        // Check Scholar dominance
        $scholarRatio = $archetypeRatios['Học Giả'] ?? ($archetypeRatios['Kỹ Sư'] ?? 0.0);
        if ($scholarRatio > 0.45) {
            $newFactions[] = [
                'name' => 'Hội Học Giả ' . rand(100, 999), 
                'type' => 'academic',
                'description' => 'Một tổ chức tri thức được thành lập bởi tầng lớp học giả.',
                'bias' => ['research' => 1.5, 'battle' => 0.5]
            ];
        }

        // Check heavy fragmentation
        if ($fragmentedScore > 0.6) {
            $newFactions[] = [
                'name' => 'Quân Cát Cứ ' . rand(100, 999), 
                'type' => 'insurgent',
                'description' => 'Một toán loạn quân hình thành trong thời kỳ suy vong.',
                'bias' => ['crime' => 1.5, 'battle' => 1.2, 'trade' => 0.2]
            ];
        }

        return $newFactions;
    }

    /**
     * Store newly formed factions into the Universe state vector.
     */
    public function storeFactions(Universe $universe, array $newFactions, int $tick): void
    {
        if (empty($newFactions)) return;

        $stateVector = $universe->state_vector ?? [];
        $existingFactions = $stateVector['factions'] ?? [];

        foreach ($newFactions as $factionConfig) {
            // Optional: Check if we have too many factions
            if (count($existingFactions) >= 10) break;

            $existingFactions[] = [
                'id' => 'faction_' . uniqid(),
                'name' => $factionConfig['name'],
                'formed_at_tick' => $tick,
                'collective_decision_bias' => $factionConfig['bias'],
                'description' => $factionConfig['description'],
                'member_actor_ids' => [] // Engine phase 6 assigns members later
            ];
        }

        $stateVector['factions'] = $existingFactions;
        $universe->state_vector = $stateVector;
    }
}
