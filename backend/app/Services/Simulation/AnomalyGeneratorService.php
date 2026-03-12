<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * AnomalyGeneratorService: Triggers unclassifiable anomalies (§V25).
 * Natural disasters (Doc §14): struct disaster (type, zone_id, intensity, tick) in state_vector and events.
 */
class AnomalyGeneratorService
{
    /** Natural disaster types (Doc §14 Disaster struct). */
    public const DISASTER_DROUGHT = 'drought';
    public const DISASTER_FLOOD = 'flood';
    public const DISASTER_QUAKE = 'earthquake';
    public const DISASTER_STORM = 'storm';
    public const DISASTER_PESTILENCE = 'pestilence';

    public const DISASTER_TYPES = [
        self::DISASTER_DROUGHT,
        self::DISASTER_FLOOD,
        self::DISASTER_QUAKE,
        self::DISASTER_STORM,
        self::DISASTER_PESTILENCE,
    ];
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
                    $worldAxioms = $universe->world?->axiom ?? [];
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

    /**
     * Spawn a natural disaster (Doc §14): write Disaster struct to state_vector.disasters and Chronicle.
     *
     * @param  array{type?: string, zone_id?: int|string, intensity?: float}  $overrides
     */
    public function spawnNaturalDisaster(Universe $universe, array $overrides = []): void
    {
        $type = $overrides['type'] ?? self::DISASTER_TYPES[array_rand(self::DISASTER_TYPES)];
        $zoneId = $overrides['zone_id'] ?? null;
        $intensity = (float) ($overrides['intensity'] ?? 0.3 + (mt_rand() / mt_getrand_max()) * 0.6);
        $tick = $universe->current_tick ?? 0;

        $disaster = [
            'type' => $type,
            'zone_id' => $zoneId,
            'intensity' => round($intensity, 2),
            'tick' => $tick,
        ];

        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $disasters = $vec['disasters'] ?? [];
        $disasters[] = $disaster;
        $vec['disasters'] = array_slice($disasters, -20);
        $universe->state_vector = $vec;
        $universe->save();

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'natural_disaster',
            'raw_payload' => [
                'action' => 'disaster_occurred',
                'disaster' => $disaster,
            ],
        ]);

        Log::info("Natural disaster [{$type}] in Universe #{$universe->id}", $disaster);
    }
}
