<?php

namespace App\Modules\Intelligence\Services;

use App\Models\Universe;
use App\Modules\Intelligence\Domain\Phase\PhaseDetector;

class MacroStateEvolution
{
    /**
     * Áp dụng MacroPressure lên Universe.
     * Logistic damping, NO clamp.
     */
    public function evolve(
        Universe $universe,
        array $archetypeRatios, // Từ ReplicatorDistributionUpdater
        float $polarizationIndex,
        float $rngNoise = 0.0 
    ): Universe {
        $warriorRatio = $archetypeRatios['Chiến Binh'] ?? ($archetypeRatios['Warlord'] ?? 0.0);
        $scholarRatio = $archetypeRatios['Học Giả'] ?? ($archetypeRatios['Kỹ Sư'] ?? 0.0);
        $merchantRatio = $archetypeRatios['Thương Nhân'] ?? 0.0;
        $warlordRatio = $archetypeRatios['Warlord'] ?? 0.0;
        $leaderRatio = $archetypeRatios['Lãnh Đạo'] ?? 0.0;

        // TÍNH MACRO PRESSURE (PHI TUYẾN)
        $warPressure = pow($warriorRatio, 1.5);
        $knowledgePressure = $scholarRatio * 0.8;
        $tradePressure = $merchantRatio * 0.7;
        $chaosPressure = $polarizationIndex * $warlordRatio;
        $leadPressure = $leaderRatio * 0.9;

        // ENTROPY EVOLUTION
        $entropy = $universe->entropy ?? 0.5;
        $entropy += $warPressure * 0.02;
        $entropy += $chaosPressure * 0.05;
        $entropy -= $entropy * (1 - $entropy) * 0.05; // self-damping
        $entropy += $rngNoise * 0.01;

        // TECH LEVEL EVOLUTION
        $techLevel = $universe->level ?? 1; // Or custom tech_level field metric
        $techLevel += $knowledgePressure * max(0, 1 - ($techLevel / 10)); // logistic cap

        // STABILITY (STRUCTURAL COHERENCE) EVOLUTION
        $stability = $universe->structural_coherence ?? 0.5;
        $stability += $leadPressure * 0.01;
        $stability -= $warPressure * 0.015;
        $stability += $tradePressure * 0.005;
        // Damping for stability? Yes, towards 0.5 default if no active pressure
        $stability += (0.5 - $stability) * 0.02;

        // Tránh giá trị âm hoặc cực trị gây lỗi hệ thống sau này (Soft limit is OK here)
        $universe->entropy = max(0.0, min(1.0, $entropy));
        $universe->structural_coherence = max(0.0, min(1.0, $stability));
        $universe->level = (int) round(max(1, $techLevel)); // Cast to int or assume level is tech
        
        // Save macro flags
        $this->updateHistoricalFlags($universe);

        return $universe;
    }
    
    /**
     * Concept III: Historical Flags
     */
    private function updateHistoricalFlags(Universe $universe): void
    {
        $stateVector = $universe->state_vector ?? [];
        if (!isset($stateVector['historical_flags'])) {
            $stateVector['historical_flags'] = [];
        }

        $flags = &$stateVector['historical_flags'];
        $techLevel = $universe->level ?? 1;

        if ($techLevel >= 3) {
            $flags['industrialized'] = true;
        }
        
        $flags['peak_tech_level'] = max($flags['peak_tech_level'] ?? 1, $techLevel);

        if (($universe->entropy ?? 0.5) > 0.8) {
            $flags['collapsed_once'] = true;
        }

        $universe->state_vector = $stateVector;
    }
}
