<?php

namespace App\Contracts;

use App\Models\UniverseSnapshot;

/**
 * doc §13: merge when similarity between two universes > threshold.
 * Returns merge candidate (sibling universe) when similarity >= threshold.
 */
interface UniverseSimilarityServiceInterface
{
    /**
     * Find a sibling universe whose state is similar enough to merge.
     *
     * @return array{universe_id: int, similarity: float}|null null if no candidate
     */
    public function getMergeCandidate(UniverseSnapshot $snapshot): ?array;
}
