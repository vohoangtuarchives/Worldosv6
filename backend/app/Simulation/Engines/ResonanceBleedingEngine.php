<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 56: Resonance Bleeding Engine (V8+) 🌈🌀
 * 
 * Thực hiện sự rò rỉ (bleeding) dữ liệu giữa các thực tại song song dựa trên độ cộng hưởng (Resonance).
 */
class ResonanceBleedingEngine
{
    public function runWithState(WorldState $state, int $tick): void
    {
        $neighbors = $state->getNeighboringRealities();
        if (empty($neighbors)) {
            return;
        }

        $localFields = $state->getFields();
        $bleedingRate = (float)config('worldos.multiverse.bleeding_rate', 0.005);

        foreach ($neighbors as $neighbor) {
            $similarity = (float)$neighbor['similarity'];
            $remoteState = (array)$neighbor['state_vector'];
            $remoteFields = $remoteState['fields'] ?? [];

            // Chỉ rò rỉ nếu độ cộng hưởng (similarity) đủ cao
            if ($similarity < 0.7) continue;

            $resonanceForce = $similarity * $bleedingRate;

            // 1. Bleeding Fields (Power, Knowledge, etc.)
            foreach ($localFields as $key => $value) {
                if (isset($remoteFields[$key])) {
                    $delta = ($remoteFields[$key] - $value) * $resonanceForce;
                    $localFields[$key] += $delta;
                }
            }

            // 2. Bleeding Axioms (Entropy Decay, Physics Constants)
            // (Thêm logic bleeding axioms ở đây nếu cần)

            Log::debug("ResonanceBleedingEngine: Reality bleeding from Neighbor #{$neighbor['universe_id']} with force {$resonanceForce}");
        }

        $state->setFields($localFields);
    }
}
