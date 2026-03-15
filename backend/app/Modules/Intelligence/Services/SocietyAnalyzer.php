<?php

namespace App\Modules\Intelligence\Services;

use App\Models\Universe;

class SocietyAnalyzer
{
    /**
     * Checks triggers for emergent faction formation based on archetype ratios
     * and fragmented scores. Returns array of Faction configurations to spawn.
     */
    public function detectEmergentFactions(array $archetypeRatios, float $fragmentedScore, \App\Services\Simulation\SimulationPRNG $rng): array
    {
        $newFactions = [];

        // Check Warrior dominance
        $warriorRatio = $archetypeRatios['Chiến Binh'] ?? 0.0;
        if ($warriorRatio > 0.35) {
            $newFactions[] = [
                'name' => 'Quân Phiệt ' . $rng->nextInt(100, 999),
                'type' => 'militaristic',
                'description' => 'Một thế lực quân phiệt trỗi dậy từ sự áp đảo của các chiến binh.',
                'bias' => ['battle' => 1.5, 'trade' => 0.6]
            ];
        }

        // Check Scholar/Engineer dominance
        $intellectRatio = ($archetypeRatios['Học Giả'] ?? 0.0) + ($archetypeRatios['Kỹ Sư'] ?? 0.0);
        if ($intellectRatio > 0.40) {
            $newFactions[] = [
                'name' => 'Hội Học Sĩ ' . $rng->nextInt(100, 999), 
                'type' => 'academic',
                'description' => 'Một tổ chức khoa học và kiến trúc được thành lập bởi các học giả và kỹ sư.',
                'bias' => ['research' => 1.5, 'battle' => 0.5]
            ];
        }

        // Check heavy fragmentation
        if ($fragmentedScore > 0.6) {
            $newFactions[] = [
                'name' => 'Quân Cát Cứ ' . $rng->nextInt(100, 999), 
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
    public function storeFactions(Universe $universe, array $newFactions, int $tick, \App\Services\Simulation\SimulationPRNG $rng): void
    {
        if (empty($newFactions)) return;

        $stateVector = $universe->state_vector ?? [];
        $existingFactions = $stateVector['factions'] ?? [];

        foreach ($newFactions as $factionConfig) {
            if (count($existingFactions) >= 10) break;

            $existingFactions[] = [
                'id' => 'faction_' . hash('crc32', $factionConfig['name'] . $tick),
                'name' => $factionConfig['name'],
                'type' => $factionConfig['type'],
                'formed_at_tick' => $tick,
                'collective_decision_bias' => $factionConfig['bias'],
                'description' => $factionConfig['description'],
                'member_actor_ids' => [],
                'ideology_vector' => [0.5, 0.5, 0.5]
            ];
        }

        $stateVector['factions'] = $existingFactions;
        $universe->state_vector = $stateVector;
    }
}
