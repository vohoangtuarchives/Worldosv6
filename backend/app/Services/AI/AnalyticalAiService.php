<?php

namespace App\Services\AI;

use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\DB;

/**
 * Analytical AI: read feature vectors from many universes, clustering/mining for phase transition rules.
 * Stub: returns placeholder; full impl would use ML/clustering.
 */
class AnalyticalAiService
{
    /**
     * Analyze snapshots across universes for collapse/phase-transition patterns.
     *
     * @param  array<int>  $universeIds
     * @return array{patterns: array, suggestion: string}
     */
    public function analyze(array $universeIds, int $limitPerUniverse = 100): array
    {
        $snapshots = UniverseSnapshot::whereIn('universe_id', $universeIds)
            ->orderByDesc('tick')
            ->limit($limitPerUniverse * count($universeIds))
            ->get(['universe_id', 'tick', 'entropy', 'stability_index', 'metrics']);

        $entropies = $snapshots->pluck('entropy')->filter()->values();
        $avgEntropy = $entropies->avg() ?? 0;
        $highEntropyCount = $entropies->filter(fn ($e) => $e >= 0.85)->count();

        return [
            'patterns' => [
                'avg_entropy' => round($avgEntropy, 4),
                'high_entropy_critical_count' => $highEntropyCount,
            ],
            'suggestion' => $highEntropyCount > 0
                ? 'Consider collapse threshold tuning or fork at criticality.'
                : 'No phase transition signals in sample.',
        ];
    }
}
