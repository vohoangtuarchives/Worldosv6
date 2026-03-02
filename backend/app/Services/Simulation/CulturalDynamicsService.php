<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\MaterialInstance;
use Illuminate\Support\Collection;

class CulturalDynamicsService
{
    /**
     * Tính toán sự biến đổi văn hóa trong một Universe.
     * 5 Chiều: Rigidity, Openness, Resilience, Spirituality, Solidarity.
     */
    public function advance(Universe $universe, int $tick): array
    {
        $currentEthos = $this->calculateUniverseEthos($universe);
        
        // Cập nhật metrics của Universe trong snapshot mới nhất
        $latestSnapshot = $universe->snapshots()->orderBy('tick', 'desc')->first();
        if ($latestSnapshot) {
            $metrics = $latestSnapshot->metrics ?? [];
            $metrics['ethos'] = $currentEthos;
            $latestSnapshot->update(['metrics' => $metrics]);
        }

        return $currentEthos;
    }

    /**
     * Tính toán Vector C_z dựa trên Materials và Metrics cơ bản.
     */
    public function calculateUniverseEthos(Universe $universe): array
    {
        $metrics = $universe->snapshots()->orderBy('tick', 'desc')->first()?->metrics ?? [];
        $entropy = $metrics['entropy'] ?? 0.5;
        $stability = $metrics['stability'] ?? 0.5;

        // Base ethos from physics
        $ethos = [
            'rigidity' => max(0, min(1, 1 - $entropy)),
            'openness' => $entropy,
            'resilience' => $stability,
            'spirituality' => ($entropy + $stability) / 2,
            'solidarity' => $stability,
        ];

        // Adjust based on active Symbolic Materials
        $activeMaterials = MaterialInstance::where('universe_id', $universe->id)
            ->whereHas('material', function($query) {
                $query->where('ontology', \App\Models\Material::ONTOLOGY_SYMBOLIC)
                      ->orWhere('ontology', \App\Models\Material::ONTOLOGY_INSTITUTIONAL);
            })
            ->with('material')
            ->get();

        foreach ($activeMaterials as $instance) {
            $coefficients = $instance->material->pressure_coefficients ?? [];
            foreach ($coefficients as $key => $value) {
                if (isset($ethos[$key])) {
                    $ethos[$key] = max(0, min(1, $ethos[$key] + ($value * $instance->current_value / 10)));
                }
            }
        }

        return $ethos;
    }
}
