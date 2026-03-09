<?php

namespace App\Modules\Intelligence\Services\Dashboard;

use App\Models\UniverseSnapshot;
use App\Models\Universe;

class StateMetricsService
{
    /**
     * Get macro metrics across all active universes or a specific one.
     */
    public function getMacroState(?int $universeId = null): array
    {
        $query = UniverseSnapshot::latest('tick');
        if ($universeId) {
            $query->where('universe_id', $universeId);
        }

        $latest = $query->first();

        if (!$latest) {
            return [
                'tech' => 0.0,
                'stability' => 0.0,
                'coercion' => 0.0,
                'entropy' => 0.0,
                'sci' => 0.0,
                'winner' => 'Unknown',
                'tick' => 0,
            ];
        }

        $state = $latest->state_vector;
        $metrics = $latest->metrics ?? [];

        // Fix: Use metrics JSON column for properties like `sci` or fallback to state vector's defaults
        return [
            'tech' => $metrics['knowledge_core'] ?? ($state['knowledge_core'] ?? ($state['knowledge'] ?? 0.0)),
            'stability' => $latest->stability_index ?? 0.0,
            'coercion' => $state['coercion'] ?? 0.0,
            'entropy' => $latest->entropy ?? 0.0,
            'sci' => $metrics['sci'] ?? ($latest->sci ?? 0.0),
            'winner' => $metrics['winner_archetype'] ?? 'Unknown',
            'tick' => $latest->tick,
        ];
    }
}
