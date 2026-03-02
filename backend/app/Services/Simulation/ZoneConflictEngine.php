<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\MaterialInstance;
use App\Models\Chronicle;
use App\Models\BranchEvent;

class ZoneConflictEngine
{
    /**
     * Scan zones within a universe and resolve conflicts between nodes.
     */
    public function resolveConflicts(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $metrics = is_string($snapshot->metrics) ? json_decode($snapshot->metrics, true) : ($snapshot->metrics ?? []);
        
        $stateVector = is_string($snapshot->state_vector) ? json_decode($snapshot->state_vector, true) : ($snapshot->state_vector ?? []);
        $zones = $stateVector['zones'] ?? [];

        // Simple check to ensure we have structured zones
        if (empty($zones)) {
            // Find zones from top-level indexing if they weren't wrapped
            $extractedZones = [];
            foreach ($stateVector as $k => $z) {
                if (is_numeric($k) && is_array($z) && isset($z['id'])) {
                    $extractedZones[] = $z;
                }
            }
            if (empty($extractedZones) && isset($stateVector[0]['id'])) {
                $extractedZones = $stateVector;
            }
            $zones = $extractedZones;
        }

        if (count($zones) < 2) {
            return; // No conflicts if there's only 1 or 0 zones
        }

        $conflictsOccurred = false;

        // Compare adjacent zones (Simulating 1D ring topology for O(n))
        $numZones = count($zones);
        for ($i = 0; $i < $numZones; $i++) {
            $zoneA = $zones[$i];
            
            // Check right neighbor
            $neighborIndex = ($i + 1) % $numZones;
            $zoneB = $zones[$neighborIndex];

            // Extract metrics (assuming 'state' contains order, entropy)
            $orderA = $this->getMetric($zoneA, 'order');
            $entropyA = $this->getMetric($zoneA, 'entropy');

            $orderB = $this->getMetric($zoneB, 'order');
            $entropyB = $this->getMetric($zoneB, 'entropy');

            // Condition for A conquering B
            if ($orderA > 0.7 && $entropyB > 0.7 && ($orderA - $orderB) > 0.4) {
                // Zone A invades Zone B
                $this->executeConquest($universe, $snapshot->tick, $zoneA['id'], $zoneB['id']);
                
                // Adjust vectors
                $zones[$i]['state']['entropy'] = max(0, $entropyA - 0.1); // A gains stability 
                $zones[$neighborIndex]['state']['entropy'] = min(1.0, $entropyB + 0.2); // B collapses further
                $zones[$neighborIndex]['state']['order'] = max(0, $orderB - 0.3); // B loses order
                
                // Add conflict marker for topology
                $zones[$i]['conflict_status'] = 'active';
                $zones[$neighborIndex]['conflict_status'] = 'active';
                
                $conflictsOccurred = true;
            }
        }

        if ($conflictsOccurred) {
            $stateVector['zones'] = $zones;
            $snapshot->state_vector = $stateVector;
            $snapshot->save();
        }
    }

    private function getMetric(array $zone, string $key): float
    {
        if (isset($zone['state']) && is_array($zone['state'])) {
            return (float) ($zone['state'][$key] ?? 0);
        }
        return 0;
    }

    private function executeConquest(Universe $universe, int $tick, string $conquerorId, string $victimId): void
    {
        // 1. Lore event
        $flavor = "Trục bánh tuế nguyệt quay cuồng. Thế lực từ phân khu [$conquerorId] đã xua quân san bằng phân khu yếu nhược [$victimId]. Tài nguyên bị tước đoạt, sinh linh lầm than trong biển lửa.";
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'zone_conflict',
            'content' => $flavor,
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'zone_conflict',
            'payload' => [
                'winner_zone' => $conquerorId,
                'loser_zone' => $victimId,
                'description' => $flavor,
            ],
        ]);

        // 2. Transfer Materials (Extremely rare operation in logic - A plunders B)
        // Look for materials where metadata 'context.zone_id' roughly equals $victimId if available,
        // or just forcefully "steal" N random materials from the universe to symbolize plunder 
        // -> In our simplified model, we'll just log it in material context
        
        $materials = MaterialInstance::where('universe_id', $universe->id)->where('lifecycle', 'active')->inRandomOrder()->take(2)->get();
        foreach ($materials as $mat) {
            $ctx = is_array($mat->context) ? $mat->context : [];
            $ctx['plundered_by_zone'] = $conquerorId;
            $ctx['plundered_from_zone'] = $victimId;
            $ctx['plundered_at_tick'] = $tick;
            $mat->update(['context' => $ctx]);
        }
    }
}
