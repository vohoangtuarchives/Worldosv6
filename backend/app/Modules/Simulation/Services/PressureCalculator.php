<?php

namespace App\Modules\Simulation\Services;

use App\Models\UniverseSnapshot;

class PressureCalculator
{
    /**
     * Calculate Material Stress for a given state (zone or universe).
     * Formula: MaterialStress ∝ (entropy level) + (base_mass depletion ratio) + (structured fragility)
     * as per WORLDOS_V6 spec.
     */
    public function calculateMaterialStress(array $state): float
    {
        $entropy = (float) ($state['entropy'] ?? 0);
        $baseMass = (float) ($state['base_mass'] ?? 1000);
        $structuredMass = (float) ($state['structured_mass'] ?? 0);
        
        // base_mass depletion ratio = (1 - structured_mass / base_mass)
        $depletionRatio = ($baseMass > 0) ? (1 - ($structuredMass / $baseMass)) : 0;
        
        // structured fragility - increased by entropy (spec §4.1)
        $fragility = $entropy * 1.5;

        // Normalized result (capped at 1.0)
        return min(1.0, ($entropy * 0.4) + ($depletionRatio * 0.3) + ($fragility * 0.3));
    }

    /**
     * Calculate Secession Pressure (Pz) for a zone.
     * Pz = a·Dz + b·Sz - c·Trust_z
     * as per WORLDOS_V6 §4.6.
     */
    public function calculateSecessionPressure(array $zoneState, array $globalState): float
    {
        $a = 0.4; // Weight for cultural distance (Dz)
        $b = 0.4; // Weight for material stress (Sz)
        $c = 0.2; // Weight for institutional trust

        $cultureDist = $this->calculateCultureDistance(
            $zoneState['culture'] ?? [], 
            $globalState['culture'] ?? []
        );
        
        $stress = $this->calculateMaterialStress($zoneState);
        $trust = (float) ($zoneState['institutional_trust'] ?? 0.5);

        $pz = ($a * $cultureDist) + ($b * $stress) - ($c * $trust);
        
        return max(0, min(1.0, $pz));
    }

    /**
     * Manhattan distance for cultural vectors.
     */
    protected function calculateCultureDistance(array $zCulture, array $gCulture): float
    {
        if (empty($zCulture) || empty($gCulture)) return 0;
        
        $sum = 0;
        $count = 0;
        foreach ($zCulture as $key => $val) {
            if (isset($gCulture[$key])) {
                $sum += abs((float)$val - (float)$gCulture[$key]);
                $count++;
            }
        }
        
        return $count > 0 ? ($sum / $count) : 0;
    }

    /**
     * Calculate global cosmic metrics: Order and Energy Level.
     * Order = 1 - entropy
     * Energy Level = base_mass utilization + innovation boost
     */
    public function calculateCosmicMetrics(array $state): array
    {
        $entropy = (float) ($state['entropy'] ?? 0);
        $order = max(0, 1 - $entropy);
        
        $baseMass = (float) ($state['base_mass'] ?? 1000);
        $structuredMass = (float) ($state['structured_mass'] ?? 0);
        $innovation = (float) ($state['innovation'] ?? 0);
        
        // Energy Level: derived from structure and innovation
        $structureRatio = ($baseMass > 0) ? ($structuredMass / $baseMass) : 0;
        $energyLevel = ($structureRatio * 0.7) + ($innovation * 0.3);
        
        return [
            'order' => $order,
            'energy_level' => min(1.0, $energyLevel),
            'entropy' => $entropy
        ];
    }
}
