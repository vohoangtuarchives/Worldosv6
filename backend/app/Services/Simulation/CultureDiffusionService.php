<?php

namespace App\Services\Simulation;

use App\Models\Universe;

/**
 * Culture Diffusion Service: Handles CZ vector dynamics (Drift & Diffusion) 
 * as per WORLDOS_V6 §4.4.
 */
class CultureDiffusionService
{
    protected float $epsilon = 0.001; // Internal drift rate
    protected float $beta = 0.005;    // Diffusion rate between neighbors

    /**
     * Define dimensions for Culture Vector (CZ).
     */
    public const DIMENSIONS = [
        'tradition',
        'innovation',
        'trust',
        'violence',
        'respect',
        'myth'
    ];

    /**
     * Apply drift and diffusion to all zones in the universe.
     */
    public function apply(Universe $universe): void
    {
        $vec = $universe->state_vector;
        if (!isset($vec['zones']) || !is_array($vec['zones'])) {
            return;
        }

        $zones = $vec['zones'];
        $newZones = $zones;

        // Ensure every zone has a culture vector
        foreach ($newZones as &$zone) {
            if (!isset($zone['culture'])) {
                $zone['culture'] = $this->initialCulture();
            }
        }

        // 1. DRITF (Internal Dynamics)
        foreach ($newZones as &$zone) {
            foreach (self::DIMENSIONS as $dim) {
                // Internal drift: small random or systemic change
                $drift = (mt_rand(-100, 100) / 1000.0) * $this->epsilon;
                $zone['culture'][$dim] = max(0.0, min(1.0, $zone['culture'][$dim] + $drift));
            }
        }

        // 2. DIFFUSION (Between Neighbors)
        // Note: This requires a neighbor graph. In current topology, 
        // zones are likely connected by proximity or explicit adjacencies.
        // For now, we assume simple adjacency based on index or ID if not provided.
        foreach ($zones as $i => $zone) {
            $neighbors = $this->getNeighbors($i, $zones);
            foreach ($neighbors as $neighborIndex) {
                foreach (self::DIMENSIONS as $dim) {
                    $diff = ($zones[$neighborIndex]['culture'][$dim] - $zone['culture'][$dim]) * $this->beta;
                    $newZones[$i]['culture'][$dim] = max(0.0, min(1.0, $newZones[$i]['culture'][$dim] + $diff));
                }
            }
        }

        $vec['zones'] = $newZones;
        $universe->update(['state_vector' => $vec]);
    }

    protected function initialCulture(): array
    {
        return [
            'tradition' => 0.5,
            'innovation' => 0.1,
            'trust' => 0.7,
            'violence' => 0.1,
            'respect' => 0.6,
            'myth' => 0.8,
        ];
    }

    /**
     * Get neighboring zone indices. Placeholder logic.
     */
    protected function getNeighbors(int $index, array $zones): array
    {
        $neighbors = [];
        $count = count($zones);
        // Simple ring topology for now as fallback
        if ($count > 1) {
            $neighbors[] = ($index - 1 + $count) % $count;
            $neighbors[] = ($index + 1) % $count;
        }
        return $neighbors;
    }
}
