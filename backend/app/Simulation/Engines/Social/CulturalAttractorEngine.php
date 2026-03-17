<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 71: Cultural Attractor Engine 🧘‍♂️🏛️
 * 
 * Mô phỏng khuynh hướng văn hóa tự ổn định (Attractors).
 * Giải thích tại sao văn minh thường quay lại những khuôn mẫu cũ.
 */
class CulturalAttractorEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string
    {
        return 'cultural_attractor';
    }

    public function phase(): string
    {
        return 'social';
    }

    public function priority(): int
    {
        return 12;
    }

    public function tickRate(): int
    {
        return 1;
    }

    /**
     * Áp dụng lực hút từ các Attractor văn hóa
     */
    public function handle(WorldState $state, TickContext $ctx): EngineResult
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

        return new EngineResult([], [], []);
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
