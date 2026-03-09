<?php

namespace App\Services\Simulation;

use App\Contracts\UniverseSimilarityServiceInterface;
use App\Models\UniverseSnapshot;

/**
 * Stub: never suggests merge. Implement real logic (e.g. compare state_vector with siblings) for merge support.
 */
final class NullUniverseSimilarityService implements UniverseSimilarityServiceInterface
{
    public function getMergeCandidate(UniverseSnapshot $snapshot): ?array
    {
        return null;
    }
}
