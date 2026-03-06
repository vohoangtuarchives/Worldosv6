<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\ZoneFieldUpdateEffect;
use App\Simulation\Services\TopologyResolver;
use App\Simulation\Services\ZonePressureCalculator;
use App\Simulation\Support\SimulationRandom;

/**
 * Zone-level Potential Field: compute → decay → diffuse → couple → write zone pressures.
 * Dual topology: uses zone['neighbors'] when present, else ring. Runs before ZoneConflictEngine.
 */
final class PotentialFieldEngine implements SimulationEngine
{
    private const DECAY = 0.97;
    private const DIFFUSION_RATE = 0.1;

    public function __construct(
        private readonly ZonePressureCalculator $calculator,
        private readonly TopologyResolver $topology,
    ) {
    }

    public function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $zones = $state->getZones();
        if (empty($zones)) {
            return [];
        }

        $globalState = array_merge($state->getStateVector(), $state->getMetrics());
        $zones = array_values($zones);
        $count = count($zones);

        // Normalize: ensure each zone has pressure keys
        foreach ($zones as $i => $zone) {
            $zoneCopy = $zone;
            $this->calculator->ensureZonePressureKeys($zoneCopy);
            $zones[$i] = $zoneCopy;
        }

        $pressureKeys = array_keys(WorldState::defaultZonePressureKeys());

        // 1) Compute deltas and apply decay per zone (dual topology for neighbors)
        $newPressures = [];
        for ($i = 0; $i < $count; $i++) {
            $neighborIndices = $this->topology->getNeighborIndices($zones, $i);
            $neighborPressures = array_map(
                fn (int $idx) => WorldState::getZonePressures($zones[$idx]),
                $neighborIndices
            );
            $deltas = $this->calculator->computeDeltas($zones[$i], $globalState, $neighborPressures);
            $current = WorldState::getZonePressures($zones[$i]);
            $newPressures[$i] = [];
            foreach ($pressureKeys as $key) {
                $val = ($current[$key] * self::DECAY) + ($deltas[$key] ?? 0);
                $newPressures[$i][$key] = max(0.0, min(1.0, (float) $val));
            }
        }

        // 2) Diffuse: each zone receives from neighbors (weighted diffusion when edge_weights present)
        $finalPressures = [];
        for ($i = 0; $i < $count; $i++) {
            $neighborsWithWeights = $this->topology->getNeighborIndicesWithWeights($zones, $i);
            $finalPressures[$i] = [];
            $weightSum = 0.0;
            foreach ($neighborsWithWeights as [, $w]) {
                $weightSum += $w;
            }
            $weightSum = max(0.01, $weightSum);
            foreach ($pressureKeys as $key) {
                $received = 0.0;
                foreach ($neighborsWithWeights as [$nIdx, $weight]) {
                    $received += (($newPressures[$nIdx][$key] ?? 0.0) * $weight);
                }
                $received = self::DIFFUSION_RATE * $received / $weightSum * 2;
                $val = ($newPressures[$i][$key] ?? 0) + $received;
                $finalPressures[$i][$key] = max(0.0, min(1.0, (float) $val));
            }
        }

        // 3) Field coupling: cross-terms between pressures
        for ($i = 0; $i < $count; $i++) {
            $finalPressures[$i] = $this->calculator->applyCoupling($finalPressures[$i]);
        }

        // 4) Write back into zone state
        for ($i = 0; $i < $count; $i++) {
            if (!isset($zones[$i]['state']) || !is_array($zones[$i]['state'])) {
                $zones[$i]['state'] = [];
            }
            foreach ($finalPressures[$i] as $key => $value) {
                $zones[$i]['state'][$key] = $value;
            }
        }

        return [new ZoneFieldUpdateEffect($zones)];
    }
}
