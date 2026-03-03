<?php

namespace App\Services\AI;

use App\Models\Universe;

/**
 * Epistemic Service: Implements the "Huyền Nguyên" (Obscure Origin) philosophy.
 * Calculates knowledge noise and distorts data to simulate epistemic instability.
 */
class EpistemicService
{
    /**
     * Calculate Knowledge Noise (N_k) based on entropy and universe state.
     * Scale: 0.0 (Perfect Clarity) to 1.0 (Absolute Obscurity).
     */
    public function calculateNoise(Universe $universe, float $entropy): float
    {
        $baseNoise = $entropy * 0.5; // Entropy directly contributes to data decay

        // Active crises increase noise significantly
        $vec = $universe->state_vector ?? [];
        $activeCrisesCount = count($vec['active_crises'] ?? []);
        $crisisBoost = $activeCrisesCount * 0.15;

        // "Void Breach" crisis adds massive instability
        if (isset($vec['active_crises']['void_breach'])) {
            $crisisBoost += 0.3;
        }

        return min(1.0, max(0.0, $baseNoise + $crisisBoost));
    }

    /**
     * Distort a data vector based on the current noise level.
     * Used for "Perceived Archive" instead of "Canonical Archive".
     */
    public function distort(array $data, float $noise): array
    {
        if ($noise <= 0.05) {
            return $data; // Near perfect clarity
        }

        $distorted = [];
        foreach ($data as $key => $value) {
            if (is_numeric($value)) {
                // Apply Gaussian-like noise: distorted = value + (noise * random_offset)
                $offset = (mt_rand() / mt_getrandmax() * 2 - 1) * $noise;
                $distorted[$key] = max(0.0, min(1.0, (float)$value + $offset));
            } elseif (is_array($value)) {
                $distorted[$key] = $this->distort($value, $noise);
            } else {
                // For strings, we could potentially scramble some characters, but let's keep it simple for now
                $distorted[$key] = $value;
            }
        }

        return $distorted;
    }

    /**
     * Get clarity label based on noise level.
     */
    public function getClarityLabel(float $noise): string
    {
        if ($noise < 0.2) return 'Chân Thực (Canonical)';
        if ($noise < 0.5) return 'Mơ Hồ (Obscure)';
        if ($noise < 0.8) return 'Huyền Sử (Mythic)';
        return 'Hư Vô (Void Echo)';
    }
}
