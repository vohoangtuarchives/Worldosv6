<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\InstitutionalEntity;
use App\Models\MythScar;
use App\Models\Actor;

/**
 * Institution Manager: Manages lifecycle of Social/Political Entities 
 * (Factions, Guilds, Orders) as per WORLDOS_V6 §4.5.
 */
class InstitutionManager
{
    /*
     * Process tick for all entities in the universe.
     */
    public function update(Universe $universe, int $tick, array $metrics = []): void
    {
        $entities = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $activeEdicts = $metrics['active_edicts'] ?? [];

        foreach ($entities as $entity) {
            $this->updateEntity($entity, $universe, $tick, $activeEdicts);
        }

        // Potential spawning of new entities based on cultural threshold AND material stress
        $this->potentialSpawn($universe, $tick, $activeEdicts);

        // Crisis Actor Spawning (Macro -> Micro Transition)
        $instability = $metrics['stability_index'] ?? 1.0;
        if ($instability < 0.4) { // If stability is low (High Instability)
            $this->spawnCrisisActors($universe, $entities, $tick);
        }
    }

    protected function spawnCrisisActors(Universe $universe, $entities, int $tick): void
    {
        // Limit total actors to prevent explosion
        $actorCount = Actor::where('universe_id', $universe->id)->where('is_alive', true)->count();
        if ($actorCount >= 20) return;

        foreach ($entities as $entity) {
            if ($entity->org_capacity > 50 && mt_rand(0, 10) === 0) {
                $this->createLeader($universe, $entity, $tick);
            }
        }
    }

    protected function createLeader(Universe $universe, InstitutionalEntity $entity, int $tick): void
    {
        $ideology = $entity->ideology_vector ?? [];
        
        $traits = array_fill(0, 17, 0.5);
        
        // Example: High Tradition ideology -> High Dogmatism
        if (($ideology['tradition'] ?? 0) > 0.7) {
            $traits[9] = 0.9; // Dogmatism
            $traits[6] = 0.8; // Conformity
        }
        
        // High Innovation -> High Curiosity
        if (($ideology['innovation'] ?? 0) > 0.7) {
            $traits[8] = 0.9; // Curiosity
            $traits[10] = 0.8; // RiskTolerance
        }
        
        Actor::create([
            'universe_id' => $universe->id,
            'name' => 'Lãnh tụ của ' . $entity->name,
            'archetype' => 'Leader',
            'traits' => $traits,
            'biography' => "Trỗi dậy trong cuộc khủng hoảng tại tick $tick, đại diện cho " . $entity->name,
            'is_alive' => true,
            'generation' => 1,
            'metrics' => ['influence' => $entity->org_capacity / 10]
        ]);
    }

    protected function updateEntity(InstitutionalEntity $entity, Universe $universe, int $tick, array $activeEdicts): void
    {
        $vec = $universe->state_vector;
        $zones = $vec['zones'] ?? [];
        $influenceMap = $entity->influence_map ?? [];
        
        $totalSupport = 0.0;
        $newInfluenceMap = [];

        // Edict Multipliers
        $capacityMultiplier = 1.0;
        $growthMultiplier = 1.0;

        foreach ($zones as $zone) {
            $zoneId = $zone['id'];
            $currentInfluence = $influenceMap[$zoneId] ?? 0.0;
            
            // Legitimacy check: alignment between entity ideology and zone culture
            $alignment = $this->calculateAlignment($entity->ideology_vector, $zone['culture'] ?? []);
            
            // Influence grows/shrinks based on alignment and existing presence
            if ($alignment > 0.4) {
                $growth = 0.02 * $alignment * $growthMultiplier;
            } else {
                $growth = -0.01 * (1.0 - $alignment);
            }

            $newInfluenceMap[$zoneId] = max(0.0, min(1.0, $currentInfluence + $growth));
            $totalSupport += $newInfluenceMap[$zoneId];
        }

        // Maintenance cost based on institutional memory and scale
        $maintenance = (count($zones) * 0.03) * (1.1 - $entity->institutional_memory);
        
        $change = ($totalSupport * 0.15 * $capacityMultiplier) - $maintenance;
        $entity->org_capacity = max(0.0, $entity->org_capacity + $change);
        $entity->influence_map = $newInfluenceMap;
        
        // Memory decay
        $entity->institutional_memory = max(0.1, $entity->institutional_memory * 0.999);

        if ($entity->org_capacity <= 0.5) {
            $this->collapse($entity, $tick);
            return;
        }

        $entity->save();
    }

    protected function potentialSpawn(Universe $universe, int $tick, array $activeEdicts): void
    {
        $vec = $universe->state_vector;
        $zones = $vec['zones'] ?? [];
        
        if (mt_rand(0, 10) > 2) return; // Only check 30% of time

        foreach ($zones as $zone) {
            $stress = (float) ($zone['state']['material_stress'] ?? ($zone['material_stress'] ?? 0));
            $culture = $zone['culture'] ?? [];
            
            // High Material Stress spawns "Rebel" factions or "Cults"
            if ($stress > 0.75 && mt_rand(0, 5) === 0) {
                $this->spawn($universe, $zone['id'], $tick, 'rebel');
                return;
            }

            $myth = $culture['myth'] ?? 0;
            $respect = $culture['respect'] ?? 0;
            $tradition = $culture['tradition'] ?? 0;

            // Cults emerge from myth
            if ($myth > 0.85 && mt_rand(0, 5) === 0) {
                $this->spawn($universe, $zone['id'], $tick, 'cult');
                return; 
            }

            // Orders emerge from tradition
            if ($tradition > 0.8 && $respect > 0.8 && mt_rand(0, 5) === 0) {
                $this->spawn($universe, $zone['id'], $tick, 'order');
                return;
            }
        }
    }

    protected function spawn(Universe $universe, int $zoneId, int $tick, string $type): void
    {
        $prefixes = [
            'cult' => ['U minh', 'Huyền ảo', 'Hư vô', 'Tà phái', 'Thiên đạo'],
            'order' => ['Hoàng gia', 'Thánh khiết', 'Trưởng lão', 'Chính nghĩa', 'Hàn lâm'],
            'rebel' => ['Khởi nghĩa', 'Tự do', 'Bóng đêm', 'Phá xiềng', 'Rạng đông']
        ];
        
        $suffixes = [
            'cult' => ['Giáo', 'Hội', 'Tông', 'U cung', 'Miếu'],
            'order' => ['Hội', 'Hiệp hội', 'Viện', 'Môn', 'Các'],
            'rebel' => ['Quân', 'Đoàn', 'Mạng', 'Hội', 'Đảng']
        ];
        
        $typeName = $prefixes[$type][array_rand($prefixes[$type])] . ' ' . $suffixes[$type][array_rand($suffixes[$type])];
        $name = $typeName . ' - Phân nhánh ' . mt_rand(10, 99);

        InstitutionalEntity::create([
            'universe_id' => $universe->id,
            'name' => $name,
            'entity_type' => $type,
            'ideology_vector' => $this->randomIdeology(),
            'org_capacity' => 15.0,
            'influence_map' => ["$zoneId" => 0.25],
            'spawned_at_tick' => $tick,
        ]);
    }

    protected function collapse(InstitutionalEntity $entity, int $tick): void
    {
        $entity->update(['collapsed_at_tick' => $tick]);
        
        // Create Myth Scar
        $primaryZone = '0';
        if (!empty($entity->influence_map)) {
            arsort($entity->influence_map);
            $primaryZone = key($entity->influence_map);
        }

        MythScar::create([
            'universe_id' => $entity->universe_id,
            'zone_id' => (string)$primaryZone,
            'name' => "Sự sụp đổ của " . $entity->name,
            'description' => "Định chế {$entity->name} đã tan rã, để lại một khoảng trống quyền lực và sẹo thần thoại.",
            'created_at_tick' => $tick,
            'severity' => 0.6,
        ]);
    }

    protected function calculateAlignment(array $ideology, array $culture): float
    {
        if (empty($ideology) || empty($culture)) return 0.5;
        
        $diff = 0.0;
        $count = 0;
        foreach ($ideology as $key => $val) {
            if (isset($culture[$key])) {
                $diff += abs($val - $culture[$key]);
                $count++;
            }
        }
        
        if ($count === 0) return 0.5;
        return 1.0 - ($diff / $count);
    }

    protected function randomIdeology(): array
    {
        return [
            'tradition' => (mt_rand(0, 100) / 100.0),
            'innovation' => (mt_rand(0, 100) / 100.0),
            'trust' => (mt_rand(0, 100) / 100.0),
            'violence' => (mt_rand(0, 100) / 100.0),
            'respect' => (mt_rand(0, 100) / 100.0),
            'myth' => (mt_rand(0, 100) / 100.0),
        ];
    }
}
