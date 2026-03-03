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
     * Calculate Reality Stability (S_r) - The inversely proportional measure to noise.
     * High Stability = Predictable laws. Low Stability = Axiom drift.
     */
    public function calculateStability(Universe $universe): float
    {
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        $metrics = $latest?->metrics ?? [];
        
        $sci = $metrics['ip_score'] ?? 0.5;
        $gradient = $metrics['instability_gradient'] ?? 0.0;
        $entropy = $latest?->entropy ?? 0.5;

        // Stability is destroyed by entropy and steep gradients
        $stability = ($sci * 0.6) + ((1.0 - $entropy) * 0.2) + ((1.0 - $gradient) * 0.2);
        
        return max(0.0, min(1.0, $stability));
    }

    /**
     * Get clarity label based on noise level (§2 of Theory).
     */
    public function getClarityLabel(float $noise): string
    {
        if ($noise < 0.2) return 'Chân Thực (Canonical)';
        if ($noise < 0.5) return 'Mơ Hồ (Obscure)';
        if ($noise < 0.8) return 'Huyền Sử (Mythic)';
        return 'Hư Vô (Void Echo)';
    }

    /**
     * Get the qualitative state of existence.
     */
    public function getExistenceState(float $noise): array
    {
        return match (true) {
            $noise < 0.2 => [
                'tier' => 'I',
                'name' => 'Chân Thực',
                'description' => 'Quy luật vật lý nhất quán. Dữ liệu chính xác tuyệt đối.',
                'effect' => 'Deterministic execution.'
            ],
            $noise < 0.5 => [
                'tier' => 'II',
                'name' => 'Mơ Hồ',
                'description' => 'Hằng số bắt đầu biến động. Thực tại bị nhòe ở các biên.',
                'effect' => 'Minor axiom drift.'
            ],
            $noise < 0.8 => [
                'tier' => 'III',
                'name' => 'Huyền Sử',
                'description' => 'Lịch sử bị biến dạng thành biểu tượng. Các Agent trở thành Icon.',
                'effect' => 'Narrative weight > Physical weight.'
            ],
            default => [
                'tier' => 'IV',
                'name' => 'Hư Vô',
                'description' => 'Sự tồn tại tan rã. Không gian mất liên kết topo.',
                'effect' => 'Structural collapse.'
            ]
        };
    }
}
