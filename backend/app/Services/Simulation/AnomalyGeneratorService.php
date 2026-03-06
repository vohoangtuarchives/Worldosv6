<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * AnomalyGeneratorService: Triggers unclassifiable anomalies (§V25).
 * Called randomly by the Chaos Engine or when strange conditions align.
 */
class AnomalyGeneratorService
{
    /**
     * Spawn a random anomaly inside the state vector.
     */
    public function spawnAnomaly(Universe $universe): void
    {
        $types = ['biological_hivemind', 'spatial_fracture', 'axiom_duplication'];
        $type = $types[array_rand($types)];
        $details = [];

        $vec = $universe->state_vector ?? [];

        switch ($type) {
            case 'biological_hivemind':
                // For a random zone, set all agents' order to 1.0 (perfect conformity)
                if (isset($vec['zones']) && !empty($vec['zones'])) {
                    $zoneIdx = array_rand($vec['zones']);
                    if (isset($vec['zones'][$zoneIdx]['state']['agents'])) {
                        foreach ($vec['zones'][$zoneIdx]['state']['agents'] as &$agent) {
                            $agent['order'] = 1.0;
                            // Add a visual tag if trait exists, though simplified here
                        }
                    }
                    $details['zone_id'] = $zoneIdx;
                }
                break;

            case 'spatial_fracture':
                // Add a permanent scar of unprecedented intensity
                $scars = $vec['scars'] ?? [];
                $scars[] = [
                    'type' => 'spatial_fracture',
                    'tick' => $universe->current_tick,
                    'description' => "Vết nứt không gian - Thời gian đóng băng.",
                    'intensity' => 0.99
                ];
                $vec['scars'] = $scars;
                $universe->structural_coherence = min(1.0, $universe->structural_coherence + 0.2); // Counter-intuitive reaction
                $content = "DỊ THƯỜNG KHÔNG GIAN: Một vết nứt tĩnh lặng xuất hiện. Ở bên trong nó, thời gian đã chết.";
                break;
            
            case 'axiom_duplication':
                // Duplicate an axiom rule randomly
                if (isset($vec['axioms'])) {
                    $worldAxioms = $universe->world->axiom ?? [];
                    if (!empty($worldAxioms)) {
                        $randomAxiom = $worldAxioms[array_rand($worldAxioms)] ?? 'gravity_shift';
                        $vec['axioms'][] = $randomAxiom; // Apply an effect twice
                        $details['duplicated_axiom'] = $randomAxiom;
                    }
                }
                break;
        }

        if ($type !== "") {
            $universe->state_vector = $vec;
            $universe->save();

            Chronicle::create([
                'universe_id' => $universe->id,
                'from_tick' => $universe->current_tick,
                'to_tick' => $universe->current_tick,
                'type' => 'chaos_anomaly',
                'raw_payload' => [
                    'action' => 'anomaly_spawned',
                    'anomaly_type' => $type,
                    'details' => $details ?? []
                ],
            ]);

            Log::warning("ANOMALY: [{$type}] spawned in Universe #{$universe->id}.");
        }
    }
}
