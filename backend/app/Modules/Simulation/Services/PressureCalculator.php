<?php

namespace App\Modules\Simulation\Services;

class PressureCalculator
{
    /**
     * Calculate Material Stress for a given state (zone or universe).
     * Formula: MaterialStress ∝ (entropy level) + (base_mass depletion ratio) + (structured fragility)
     * as per WORLDOS_V6 spec.
     */
    public function calculateMaterialStress(array $state): float
    {
        $entropy = max(0.0, (float) ($state['entropy'] ?? 0));
        $baseMass = max(0.0, (float) ($state['base_mass'] ?? 1000));
        $structuredMass = max(0.0, (float) ($state['structured_mass'] ?? 0));

        // base_mass depletion ratio = (1 - structured_mass / base_mass)
        // if base mass is invalid/non-positive, treat as maximal depletion.
        $depletionRatio = $baseMass > 0
            ? $this->normalizeRatio(1 - ($structuredMass / $baseMass))
            : 1.0;

        // structured fragility - increased by entropy (spec §4.1)
        $fragility = $this->normalizeRatio($entropy * 1.5);

        // Normalized result in [0, 1] to prevent invalid negative stress from malformed state vectors.
        $stress = ($entropy * 0.4) + ($depletionRatio * 0.3) + ($fragility * 0.3);

        return $this->normalizeRatio($stress);
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
        $trust = $this->normalizeRatio((float) ($zoneState['institutional_trust'] ?? 0.5));

        $pz = ($a * $cultureDist) + ($b * $stress) - ($c * $trust);

        return $this->normalizeRatio($pz);
    }

    /**
     * Manhattan distance for cultural vectors.
     */
    protected function calculateCultureDistance(array $zCulture, array $gCulture): float
    {
        if (empty($zCulture) || empty($gCulture)) {
            return 0.0;
        }

        $sum = 0;
        $count = 0;
        foreach ($zCulture as $key => $val) {
            if (isset($gCulture[$key])) {
                $zoneValue = $this->normalizeRatio((float) $val);
                $globalValue = $this->normalizeRatio((float) $gCulture[$key]);
                $sum += abs($zoneValue - $globalValue);
                $count++;
            }
        }

        return $count > 0 ? ($sum / $count) : 0.0;
    }

    /**
     * Calculate global cosmic metrics: Order and Energy Level.
     * Order = 1 - entropy
     * Energy Level = base_mass utilization + innovation boost; fallback from order/stability khi state không có structured_mass/innovation.
     */
    public function calculateCosmicMetrics(array $state): array
    {
        $entropy = (float) ($state['entropy'] ?? 0);
        $order = $this->normalizeRatio(1 - $entropy);

        $baseMass = max(0.0, (float) ($state['base_mass'] ?? 1000));
        $structuredMass = max(0.0, (float) ($state['structured_mass'] ?? 0));
        $innovation = $this->normalizeRatio((float) ($state['innovation'] ?? 0));

        // Energy Level: derived from structure and innovation
        $structureRatio = $baseMass > 0 ? $this->normalizeRatio($structuredMass / $baseMass) : 0.0;
        $energyLevel = ($structureRatio * 0.7) + ($innovation * 0.3);

        // Fallback: engine thường không trả structured_mass/innovation → energy_level = 0. Suy từ order + stability để có giá trị hiển thị.
        if ($energyLevel <= 0) {
            $stability = $this->normalizeRatio((float) ($state['stability_index'] ?? 0.5));
            $energyLevel = ($order * 0.5) + ($stability * 0.5);
        }

        return [
            'order' => $order,
            'energy_level' => $this->normalizeRatio($energyLevel),
            'entropy' => $entropy,
        ];
    }

    protected function normalizeRatio(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}
