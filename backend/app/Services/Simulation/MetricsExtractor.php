<?php

namespace App\Services\Simulation;

use App\Models\UniverseSnapshot;

class MetricsExtractor
{
    /**
     * Extract metrics from snapshot for evaluation (entropy trend, complexity, stability).
     */
    public function extract(UniverseSnapshot $snapshot): array
    {
        $state = $snapshot->state_vector ?? [];
        $entropy = (float) ($snapshot->entropy ?? 0);
        $stability = (float) ($snapshot->stability_index ?? 0);
        $zoneCount = is_array($state) ? count($state) : 0;

        return [
            'entropy' => $entropy,
            'stability_index' => $stability,
            'complexity' => $zoneCount,
            'entropy_trend' => 0, // would need history of snapshots
        ];
    }
}
