<?php

namespace App\Modules\Institutions\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\MaterialInstance;

class SocialDynamicsEngine
{
    public const DIMENSIONS = [
        'tradition',
        'innovation',
        'trust',
        'violence',
        'respect',
        'myth'
    ];

    /**
     * Advance collective cultural dynamics for the universe.
     */
    public function advance(Universe $universe, int $tick): array
    {
        $ethos = $this->calculateUniverseEthos($universe);
        $this->applyCultureDiffusion($universe);

        $latestSnapshot = $universe->snapshots()->where('tick', $tick)->first();
        if ($latestSnapshot) {
            $metrics = $latestSnapshot->metrics ?? [];
            $metrics['ethos'] = $ethos;
            $latestSnapshot->update(['metrics' => $metrics]);
        }

        return $ethos;
    }

    public function calculateUniverseEthos(Universe $universe): array
    {
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        $entropy = (float)($latest->entropy ?? 0.5);
        $stability = (float)($latest->stability_index ?? 0.5);

        $ethos = [
            'rigidity' => max(0, min(1, 1 - $entropy)),
            'openness' => $entropy,
            'resilience' => $stability,
            'spirituality' => ($entropy + $stability) / 2,
            'solidarity' => $stability,
        ];

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

    protected function applyCultureDiffusion(Universe $universe): void
    {
        $vec = $universe->state_vector;
        if (!isset($vec['zones']) || !is_array($vec['zones'])) return;

        $zones = $vec['zones'];
        $epsilon = 0.001; // Drift
        $beta = 0.005;    // Diffusion

        // 1. Drift
        foreach ($zones as &$zone) {
            $culture = $zone['culture'] ?? $this->initialCulture();
            foreach (self::DIMENSIONS as $dim) {
                $drift = (mt_rand(-100, 100) / 1000.0) * $epsilon;
                $culture[$dim] = max(0.0, min(1.0, ($culture[$dim] ?? 0.5) + $drift));
            }
            $zone['culture'] = $culture;
        }

        // 2. Diffusion (Ring Topology)
        $newZones = $zones;
        $count = count($zones);
        if ($count > 1) {
            foreach ($zones as $i => $zone) {
                $neighbors = [($i - 1 + $count) % $count, ($i + 1) % $count];
                foreach ($neighbors as $nIdx) {
                    foreach (self::DIMENSIONS as $dim) {
                        $diff = ($zones[$nIdx]['culture'][$dim] - $zone['culture'][$dim]) * $beta;
                        $newZones[$i]['culture'][$dim] = max(0.0, min(1.0, $newZones[$i]['culture'][$dim] + $diff));
                    }
                }
            }
        }

        $vec['zones'] = $newZones;
        $universe->update(['state_vector' => $vec]);
    }

    protected function initialCulture(): array
    {
        return [
            'tradition' => 0.5,
            'innovation' => 0.1,
            'trust' => 0.7,
            'violence' => 0.1,
            'respect' => 0.6,
            'myth' => 0.8,
        ];
    }
}
