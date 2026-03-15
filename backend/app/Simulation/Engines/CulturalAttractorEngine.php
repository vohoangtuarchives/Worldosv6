<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 71: Cultural Attractor Engine 🧘‍♂️🏛️
 * 
 * Mô phỏng khuynh hướng văn hóa tự ổn định (Attractors).
 * Giải thích tại sao văn minh thường quay lại những khuôn mẫu cũ.
 */
class CulturalAttractorEngine
{
    /**
     * Áp dụng lực hút từ các Attractor văn hóa
     */
    public function run(WorldState $state, int $tick): void
    {
        $currentCulture = $state->get('meta.culture_vector', [
            'collectivism' => 0.5,
            'religiosity' => 0.5,
            'rationality' => 0.5
        ]);

        $activeAttractor = $this->determineActiveAttractor($state);
        
        $pullStrength = 0.02;
        foreach ($currentCulture as $key => &$value) {
            $target = $activeAttractor[$key] ?? $value;
            $value += ($target - $value) * $pullStrength;
        }

        $state->set('meta.culture_vector', $currentCulture);
    }

    private function determineActiveAttractor(WorldState $state): array
    {
        // Ví dụ: Attractor "Theocracy" nếu tôn giáo cao
        if ((float)$state->get('fields.belief', 0) > 0.7) {
            return [
                'collectivism' => 0.8,
                'religiosity' => 0.9,
                'rationality' => 0.2
            ];
        }

        // Mặc định: "Balanced Stability"
        return [
            'collectivism' => 0.5,
            'religiosity' => 0.5,
            'rationality' => 0.5
        ];
    }
}
