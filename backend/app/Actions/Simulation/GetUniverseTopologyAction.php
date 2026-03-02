<?php

namespace App\Actions\Simulation;

use App\Models\UniverseSnapshot;

class GetUniverseTopologyAction
{
    /**
     * Lấy danh sách các Zone và tọa độ hóa (nếu cần) từ Snapshot mới nhất.
     */
    public function execute(int $universeId): array
    {
        $snapshot = UniverseSnapshot::where('universe_id', $universeId)
            ->orderBy('tick', 'desc')
            ->first();

        if (!$snapshot) {
            return [];
        }

        $stateVector = is_string($snapshot->state_vector) 
            ? json_decode($snapshot->state_vector, true) 
            : $snapshot->state_vector;

        $zones = [];

        // Parse from Rust Format `[{"id":0,"neighbors":[],"state":{...}}]`
        if (is_array($stateVector) && isset($stateVector[0]['state'])) {
            $zones = $stateVector;
        } 
        // Parse from Old Format `{"zones": [...]}`
        elseif (isset($stateVector['zones']) && is_array($stateVector['zones'])) {
            $zones = $stateVector['zones'];
        }

        $topologyData = [];

        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universeId)
            ->whereNull('collapsed_at_tick')
            ->get();

        foreach ($zones as $index => $zoneData) {
            $id = $zoneData['id'] ?? $index;
            $state = $zoneData['state'] ?? $zoneData;
            
            // Generate deterministic pseudorandom coordinates if not provided
            $x = $zoneData['x'] ?? (sin($id * 123.45) * 40 + 50); // Mapped roughly to 10-90%
            $y = $zoneData['y'] ?? (cos($id * 678.90) * 40 + 50);

            // Find Dominant Institution for this zone
            $dominant = null;
            $maxInfluence = 0.1; // Threshold
            foreach ($institutions as $entity) {
                $influence = $entity->influence_map[$id] ?? 0;
                if ($influence > $maxInfluence) {
                    $maxInfluence = $influence;
                    $dominant = [
                        'name' => $entity->name,
                        'type' => $entity->entity_type,
                        'influence' => round($influence, 2)
                    ];
                }
            }

            $topologyData[] = [
                'id' => $id,
                'x'  => $x,
                'y'  => $y,
                'entropy' => $state['entropy'] ?? 0,
                'material_stress' => $state['material_stress'] ?? 0,
                'base_mass' => $state['base_mass'] ?? 100,
                'culture' => $zoneData['culture'] ?? ($state['culture'] ?? null),
                'dominant_institution' => $dominant,
                'neighbors' => $zoneData['neighbors'] ?? [],
            ];
        }

        return $topologyData;
    }
}
