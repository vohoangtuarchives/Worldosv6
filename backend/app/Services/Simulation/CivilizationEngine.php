<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\InstitutionalEntity;
use Illuminate\Support\Facades\Log;

/**
 * Emergent Civilization Engine (WorldOS V6 §4.7 & §3.6)
 * Detects clusters of zones with similar culture and forms institutions.
 */
class CivilizationEngine
{
    protected float $similarityThreshold = 0.85;
    protected int $minClusterSize = 2;

    /**
     * Process snapshot to detect and update civilizations.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $stateVector = is_string($snapshot->state_vector) 
            ? json_decode($snapshot->state_vector, true) 
            : ($snapshot->state_vector ?? []);

        if (empty($stateVector)) {
            return;
        }

        // 1. Cluster zones based on topology and cultural similarity
        $clusters = $this->findCulturalClusters($stateVector);

        // 2. Manage entities based on clusters
        foreach ($clusters as $clusterIndex => $zoneIds) {
            $this->manageCivilization($universe, $snapshot, $clusterIndex, $zoneIds, $stateVector);
        }

        // 3. Mark collapsed civilizations
        $this->detectCivilizationCollapses($universe, $snapshot, $clusters);
    }

    /**
     * BFS Clustering based on neighbors and cultural vector similarity.
     */
    protected function findCulturalClusters(array $zones): array
    {
        $clusters = [];
        $visited = [];
        
        // Map ID to Zone index for easy lookups
        $idMap = [];
        foreach ($zones as $index => $z) {
            $idMap[$z['id']] = $index;
        }

        foreach ($zones as $index => $zone) {
            $id = $zone['id'];
            if (isset($visited[$id])) continue;

            // Start a new cluster
            $currentCluster = [];
            $queue = [$index];
            $visited[$id] = true;

            while (!empty($queue)) {
                $currIdx = array_shift($queue);
                $currZone = $zones[$currIdx];
                $currentCluster[] = $currZone['id'];

                $neighbors = $currZone['neighbors'] ?? [];
                foreach ($neighbors as $neighborId) {
                    if (isset($visited[$neighborId])) continue;
                    
                    if (!isset($idMap[$neighborId])) continue;
                    $neighborIdx = $idMap[$neighborId];
                    $neighborZone = $zones[$neighborIdx];

                    if ($this->isCulturallySimilar($currZone, $neighborZone)) {
                        $visited[$neighborId] = true;
                        $queue[] = $neighborIdx;
                    }
                }
            }

            if (count($currentCluster) >= $this->minClusterSize) {
                $clusters[] = $currentCluster;
            }
        }

        return $clusters;
    }

    /**
     * Check similarity using Cosine Similarity or Euclidean Distance on Cultural Vectors.
     */
    protected function isCulturallySimilar(array $z1, array $z2): bool
    {
        $v1 = $z1['state']['cultural'] ?? [];
        $v2 = $z2['state']['cultural'] ?? [];

        if (empty($v1) || empty($v2)) return false;

        $dimensions = ['tradition_rigidity', 'innovation_openness', 'collective_trust', 'violence_tolerance', 'institutional_respect'];
        $sumSqDiff = 0;
        foreach ($dimensions as $dim) {
            $val1 = $v1[$dim] ?? 0.5;
            $val2 = $v2[$dim] ?? 0.5;
            $sumSqDiff += pow($val1 - $val2, 2);
        }

        $distance = sqrt($sumSqDiff);
        // Normalize distance: max distance is sqrt(5) ~ 2.23
        $similarity = 1 - ($distance / 2.24);

        return $similarity >= $this->similarityThreshold;
    }

    /**
     * Create or update a Civilization entity.
     */
    protected function manageCivilization(Universe $universe, UniverseSnapshot $snapshot, int $index, array $zoneIds, array $allZones): void
    {
        // Simple naming or lookup existing by majority of zones
        $name = "Đế chế " . $this->generateCivName($zoneIds);
        
        // Calculate average ideology vector
        $avgIdeology = $this->calculateAverageCulture($zoneIds, $allZones);

        $entity = InstitutionalEntity::updateOrCreate(
            [
                'universe_id' => $universe->id,
                'entity_type' => 'CIVILIZATION',
                'name' => $name, // For now, we use the generated name as key or improve matching
            ],
            [
                'ideology_vector' => $avgIdeology,
                'influence_map' => $zoneIds,
                'org_capacity' => 0.8, // Base capacity
                'legitimacy' => 0.9,
                'spawned_at_tick' => $snapshot->tick,
            ]
        );

        if ($entity->wasRecentlyCreated) {
            Log::info("Emergent Civilization Spawned: {$name} across zones " . implode(',', $zoneIds));
        }
    }

    protected function calculateAverageCulture(array $zoneIds, array $allZones): array
    {
        $idMap = [];
        foreach ($allZones as $z) $idMap[$z['id']] = $z;

        $sum = [];
        $count = 0;
        foreach ($zoneIds as $id) {
            if (!isset($idMap[$id])) continue;
            $c = $idMap[$id]['state']['cultural'] ?? [];
            foreach ($c as $k => $v) {
                $sum[$k] = ($sum[$k] ?? 0) + $v;
            }
            $count++;
        }

        if ($count === 0) return [];
        return array_map(fn($v) => $v / $count, $sum);
    }

    protected function generateCivName(array $zoneIds): string
    {
        $prefixes = ['Hùng', 'Lạc', 'Âu', 'Việt', 'Đông', 'Nam', 'Tây', 'Bắc'];
        $suffixes = ['Vương', 'Quốc', 'Bang', 'Tộc', 'Liên minh'];
        
        $seed = $zoneIds[0] ?? 0;
        return $prefixes[$seed % count($prefixes)] . $suffixes[($seed / 2) % count($suffixes)];
    }

    /**
     * Detect civilizations that no longer have enough zones for stability.
     */
    protected function detectCivilizationCollapses(Universe $universe, UniverseSnapshot $snapshot, array $activeClusters): void
    {
        $existingCivs = InstitutionalEntity::where('universe_id', $universe->id)
            ->where('entity_type', 'CIVILIZATION')
            ->whereNull('collapsed_at_tick')
            ->get();

        $activeZoneSets = array_map(fn($c) => array_flip($c), $activeClusters);

        foreach ($existingCivs as $civ) {
            $influence = $civ->influence_map ?? [];
            $foundMatch = false;
            
            // If the majority of zones in the civ are still in some shared cluster, it's alive
            foreach ($activeZoneSets as $clusterSet) {
                $overlap = 0;
                foreach ($influence as $id) {
                    if (isset($clusterSet[$id])) $overlap++;
                }

                if ($overlap >= count($influence) * 0.5) {
                    $foundMatch = true;
                    break;
                }
            }

            if (!$foundMatch) {
                $civ->update([
                    'collapsed_at_tick' => $snapshot->tick,
                    'org_capacity' => 0,
                ]);
                Log::info("Civilization Collapsed due to Cultural Fragmentation: {$civ->name}");
                
                // Trigger Meta-Cycle event
                event(new \App\Events\Simulation\AnomalyDetected($universe, [
                    'title' => 'Sụp đổ Đại Văn Minh: ' . $civ->name,
                    'description' => 'Sự phân rã bản sắc văn hóa đã dẫn đến sự sụp đổ của một thực thể chính trị vĩ đại.',
                    'severity' => 'WARN'
                ]));
            }
        }
    }
}
