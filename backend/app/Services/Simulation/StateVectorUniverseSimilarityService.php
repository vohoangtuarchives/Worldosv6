<?php

namespace App\Services\Simulation;

use App\Contracts\UniverseSimilarityServiceInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

/**
 * doc §13: merge when similarity between two universes > threshold.
 * Compares state_vector (entropy, fields, zones) with sibling universes in the same world.
 */
final class StateVectorUniverseSimilarityService implements UniverseSimilarityServiceInterface
{
    private const FIELD_KEYS = ['survival', 'power', 'wealth', 'knowledge', 'meaning'];

    public function getMergeCandidate(UniverseSnapshot $snapshot): ?array
    {
        $universe = $snapshot->universe;
        if (!$universe || !$universe->world_id) {
            return null;
        }

        $threshold = (float) config('worldos.autonomic.merge_similarity_threshold', 0.92);
        $currentVec = $this->extractFeatureVector($snapshot);

        $siblings = Universe::where('world_id', $universe->world_id)
            ->where('status', 'active')
            ->where('id', '!=', $universe->id)
            ->get();

        $bestCandidate = null;
        $bestSimilarity = $threshold;

        foreach ($siblings as $sibling) {
            $siblingSnap = UniverseSnapshot::where('universe_id', $sibling->id)
                ->orderByDesc('tick')
                ->first();
            if (!$siblingSnap || !$siblingSnap->state_vector) {
                continue;
            }

            $siblingVec = $this->extractFeatureVector($siblingSnap);
            $similarity = $this->similarity($currentVec, $siblingVec);
            if ($similarity >= $bestSimilarity) {
                $bestSimilarity = $similarity;
                $bestCandidate = [
                    'universe_id' => (int) $sibling->id,
                    'similarity'  => round($bestSimilarity, 4),
                ];
            }
        }

        return $bestCandidate;
    }

    /**
     * Extract a comparable feature vector from snapshot state_vector.
     *
     * @return array<string, float>
     */
    private function extractFeatureVector(UniverseSnapshot $snapshot): array
    {
        $vec = (array) ($snapshot->state_vector ?? []);
        $fields = (array) ($vec['fields'] ?? []);

        $features = [
            'entropy' => (float) ($snapshot->entropy ?? $vec['entropy'] ?? 0.5),
        ];
        foreach (self::FIELD_KEYS as $key) {
            $features[$key] = (float) ($fields[$key] ?? 0.5);
        }
        $zones = $vec['zones'] ?? [];
        $features['zones_count'] = is_array($zones)
            ? min(1.0, (float) count($zones) / 20.0)
            : 0.0;

        return $features;
    }

    /**
     * Similarity in [0, 1]: 1 - normalized Euclidean distance.
     *
     * @param array<string, float> $a
     * @param array<string, float> $b
     */
    private function similarity(array $a, array $b): float
    {
        $keys = array_keys($a);
        $sum = 0.0;
        $n = 0;
        foreach ($keys as $k) {
            if (!array_key_exists($k, $b)) {
                continue;
            }
            $diff = ($a[$k] ?? 0.0) - ($b[$k] ?? 0.0);
            $sum += $diff * $diff;
            $n++;
        }
        if ($n === 0) {
            return 0.0;
        }
        $dist = sqrt($sum / $n);
        return max(0.0, min(1.0, 1.0 - $dist));
    }
}
