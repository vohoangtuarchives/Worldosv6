<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\Chronicle;
use App\Models\InstitutionalEntity;

/**
 * Celestial Engineering Action: Handles high-tech macro-manipulations.
 */
class CelestialEngineeringAction
{
    /**
     * Apply celestial engineering effects based on tech level and institutional capacity.
     */
    public function execute(Universe $universe, int $tick, array $metrics): void
    {
        $techLevel = (float)($metrics['tech_level'] ?? 0.0);
        
        // Threshold: Tech Level > 0.8
        if ($techLevel < 0.8) return;

        $vec = $universe->state_vector ?? [];
        $entropy = (float)($vec['entropy'] ?? 0.5);

        // 1. Dyson Construction: If mass > threshold and tech is high, increase energy
        // (Placeholder: Logic to increase a 'free_energy' factor in state vector)
        
        // 2. Entropy Reversal: If entropy is high and tech is very high (>0.9)
        if ($entropy > 0.7 && $techLevel > 0.9) {
            $this->reverseEntropy($universe, $tick);
        }
    }

    protected function reverseEntropy(Universe $universe, int $tick): void
    {
        // High cost: Increase trauma, consume mass
        $vec = $universe->state_vector;
        
        $oldEntropy = $vec['entropy'];
        $reduction = 0.15;
        $vec['entropy'] = max(0.2, $vec['entropy'] - $reduction);
        $vec['trauma'] = ($vec['trauma'] ?? 0) + 0.25; // Massive psychological cost

        $universe->update(['state_vector' => $vec]);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'celestial_engineering',
            'content' => "KỸ NGHỆ THIÊN THỂ: Các đại định chế đã sử dụng công nghệ Singularity để ĐẢO NGƯỢC ENTROPY, kéo lùi sự tan rã của vũ trụ từ {$oldEntropy} xuống {$vec['entropy']}. Tuy nhiên, cái giá là chấn thương tâm lý diện rộng.",
        ]);
    }
}
