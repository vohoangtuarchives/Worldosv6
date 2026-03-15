<?php

namespace App\Modules\Simulation\Services;

use App\Services\Simulation\RuleVmService;
use function resource_path;
use function file_get_contents;
use function array_merge;
use function abs;
use function max;
use function min;

class PressureCalculator
{
    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    /**
     * Calculate Material Stress for a given state (zone or universe).
     */
    public function calculateMaterialStress(array $state): float
    {
        $dslFile = resource_path('worldos_rules/simulation/pressures.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $result = $this->ruleVm->evaluateRawState($state, $dsl);

        return (float) ($result['state']['material_stress'] ?? 0.0);
    }

    /**
     * Calculate Secession Pressure (Pz) for a zone.
     * Pz = a·Dz + b·Sz - c·Trust_z
     * as per WORLDOS_V6 §4.6.
     */
    public function calculateSecessionPressure(array $zoneState, array $globalState): float
    {
        $dslFile = resource_path('worldos_rules/simulation/pressures.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        // We need both zone and global state. We'll merge them for evaluation or pass as context.
        // For simplicity, we'll assume the engine handles cultural distance if we pass global culture.
        $evalState = array_merge($zoneState, [
            'global_culture' => $globalState['culture'] ?? []
        ]);

        $result = $this->ruleVm->evaluateRawState($evalState, $dsl);

        return (float) ($result['state']['secession_pressure'] ?? 0.0);
    }

    /**
     * Manhattan distance for cultural vectors (Legacy/Internal helper if still needed).
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
     */
    public function calculateCosmicMetrics(array $state): array
    {
        $dslFile = resource_path('worldos_rules/simulation/pressures.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $result = $this->ruleVm->evaluateRawState($state, $dsl);
        $finalState = $result['state'] ?? [];

        return [
            'order' => (float) ($finalState['order'] ?? 1.0),
            'energy_level' => (float) ($finalState['energy_level'] ?? 0.5),
            'entropy' => (float) ($state['entropy'] ?? 0.0),
        ];
    }

    protected function normalizeRatio(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}
