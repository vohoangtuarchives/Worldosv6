<?php

namespace App\Modules\Intelligence\Services;

class ArchetypeResolverService
{
    /**
     * Universal pool available in every world.
     */
    private const UNIVERSAL_POOL = [
        'Chiến Binh'   => 1.0,  // Warrior/Hero
        'Thương Nhân'   => 1.0,  // Merchant
        'Học Giả'       => 1.0,  // Scholar/Sage
        'Lãnh Đạo'      => 0.8,  // Leader/Chief
        'Người Thường'  => 1.5,  // Commoner
    ];

    /**
     * Resolves an archetype probabilistically from the pool.
     * Replaces the hardcoded "Ẩn Sĩ" logic.
     * 
     * @param array $worldAxiom The World rules axiom JSON
     * @param float $worldEntropy The current entropy of the Universe
     * @param float $worldStability The current stability / structure of the Universe
     */
    public function resolve(array $worldAxiom, float $worldEntropy = 0.5, float $worldStability = 0.5): string
    {
        $pool = self::UNIVERSAL_POOL;

        // Conditional additions
        $hasMartialArts = $worldAxiom['has_martial_arts'] ?? false;
        $hasLinhKi = $worldAxiom['has_linh_ki'] ?? false;
        $hasMagic = $worldAxiom['has_magic'] ?? false;
        $techLevel = $worldAxiom['tech_level'] ?? 1;

        if ($hasMartialArts) {
            $pool['Kiếm Sĩ'] = 1.0;
        }

        if ($hasLinhKi) {
            $pool['Tu Chân Giả'] = 1.2;
            $pool['Tà Tu'] = 0.5;
        } elseif ($hasMartialArts) {
            // Wuxia but no Xianxia
            $pool['Dưỡng Sinh Gia'] = 0.7;
        }

        if ($techLevel >= 3) {
            $pool['Kỹ Sư'] = 1.0;
        }

        if ($techLevel >= 5) {
            $pool['Hacker'] = 0.6;
        }

        if ($hasMagic) {
            $pool['Pháp Sư'] = 0.8;
        }

        // Weight modifier by state
        if ($worldEntropy > 0.7) {
            if (isset($pool['Tà Tu'])) $pool['Tà Tu'] *= 2;
            if (isset($pool['Chiến Binh'])) $pool['Chiến Binh'] *= 2;
        } elseif ($worldEntropy < 0.3) {
            if (isset($pool['Học Giả'])) $pool['Học Giả'] *= 1.5;
            if (isset($pool['Thương Nhân'])) $pool['Thương Nhân'] *= 1.5;
        }

        if ($worldStability < 0.4) {
             if (isset($pool['Lãnh Đạo'])) $pool['Lãnh Đạo'] *= 2;
        }

        return $this->selectFromWeightedPool($pool);
    }

    /**
     * Select a random key from a weighted array
     */
    private function selectFromWeightedPool(array $pool): string
    {
        $totalWeight = array_sum($pool);
        $rand = (rand(0, 10000) / 10000) * $totalWeight; // Note: Use SimulationRng in engine context, ok here for initial spawn.
        
        $cumulative = 0;
        foreach ($pool as $archetype => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $archetype;
            }
        }

        return array_key_first($pool);
    }
}
