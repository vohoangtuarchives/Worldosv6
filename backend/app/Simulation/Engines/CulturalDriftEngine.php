<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\ZoneCultureUpdateEffect;
use App\Simulation\Services\TopologyResolver;
use App\Simulation\Support\SimulationRandom;

/**
 * Culture/ideology/myth drift and diffusion between zones (kernel engine).
 * Uses dual topology for neighbors; deterministic via SimulationRandom.
 */
final class CulturalDriftEngine implements SimulationEngine
{
    private const DIMENSIONS = ['tradition', 'innovation', 'trust', 'violence', 'respect', 'myth'];
    private const DRIFT_EPSILON = 0.001;
    private const DIFFUSION_BETA = 0.005;

    public function __construct(
        private readonly TopologyResolver $topology,
    ) {
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.cultural_drift') ?? 3));
    }

    public function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $zones = $state->getZones();
        if (empty($zones)) {
            return [];
        }

        $zones = array_values($zones);
        $count = count($zones);
        $tick = $state->getTick();
        $salt = 2;

        // Build current culture per zone (from state.culture or zone.culture)
        $cultures = [];
        for ($i = 0; $i < $count; $i++) {
            $zone = $zones[$i];
            $cultures[$i] = $this->getCulture($zone);
        }

        // 1) Drift: small random nudge (deterministic from rng)
        for ($i = 0; $i < $count; $i++) {
            $rngZone = new SimulationRandom(
                (int) $state->getUniverseId(),
                $tick,
                $salt + $i * 100
            );
            foreach (self::DIMENSIONS as $dim) {
                $nudge = ($rngZone->float(0, 1) - 0.5) * 2 * self::DRIFT_EPSILON;
                $cultures[$i][$dim] = max(0.0, min(1.0, ($cultures[$i][$dim] ?? 0.5) + $nudge));
            }
        }

        // 2) Diffusion from neighbors (dual topology)
        $newCultures = $cultures;
        for ($i = 0; $i < $count; $i++) {
            $neighborIndices = $this->topology->getNeighborIndices($zones, $i);
            foreach (self::DIMENSIONS as $dim) {
                $diff = 0.0;
                foreach ($neighborIndices as $nIdx) {
                    $diff += (($cultures[$nIdx][$dim] ?? 0.5) - ($cultures[$i][$dim] ?? 0.5)) * self::DIFFUSION_BETA;
                }
                $newCultures[$i][$dim] = max(0.0, min(1.0, ($newCultures[$i][$dim] ?? 0.5) + $diff));
            }
        }

        return [new ZoneCultureUpdateEffect($newCultures)];
    }

    /** @return array<string, float> */
    private function getCulture(array $zone): array
    {
        $state = $zone['state'] ?? [];
        $culture = $state['culture'] ?? $zone['culture'] ?? null;
        if (is_array($culture)) {
            $out = [];
            foreach (self::DIMENSIONS as $d) {
                $out[$d] = (float) ($culture[$d] ?? 0.5);
            }
            return $out;
        }
        return [
            'tradition' => 0.5,
            'innovation' => 0.1,
            'trust' => 0.7,
            'violence' => 0.1,
            'respect' => 0.6,
            'myth' => 0.8,
        ];
    }
}
