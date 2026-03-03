<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class VillageElder extends BaseArchetype
{
    public function getName(): string { return 'Làng Lão'; }

    public function isEligible(World $world): bool
    {
        // Village Elder xuất hiện khi văn hóa có tính kế thừa cao hoặc Origin là Việt Nam
        $vec = $world->evolution_genome ?? [];
        return ($vec['origin_heritage'] ?? '') === 'Vietnamese' || ($vec['spirituality'] ?? 0) > 0.5;
    }

    public function getBaseUtility(float $stability): float
    {
        // Làng lão có uy tín cao khi xã hội ổn định hoặc cần sự hòa giải
        return $stability * 1.5;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, "Village Wisdom", "Truyền thống được củng cố. Tinh thần cộng đồng của {$winnerAgent['name']} giúp giảm bớt sự chia rẽ.", -0.3);
        
        // Tác động trực tiếp vào Stability
        $metrics = $snapshot->metrics ?? [];
        $metrics['growth'] = ($metrics['growth'] ?? 0) + 0.05;
        $snapshot->metrics = $metrics;
        $snapshot->save();

        return "Làng lão {$winnerAgent['name']} đã sử dụng uy tín của mình để xoa dịu các mâu thuẫn, củng cố tính chính danh của các định chế truyền thống.";
    }
}
