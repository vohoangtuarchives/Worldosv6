<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class Archmage extends BaseArchetype
{
    public function getName(): string { return 'Archmage'; }

    public function isEligible(World $world): bool
    {
        $origin = strtolower($world->origin);
        return str_contains($origin, 'mystic') || str_contains($origin, 'fantasy') || str_contains($origin, 'european') || str_contains($origin, 'vietnamese');
    }

    public function getBaseUtility(float $stability): float
    {
        // Archmage mạnh nhất khi thế giới bắt đầu mất ổn định (mana tràn trề)
        return 1.3 - ($stability * 0.5);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, "Astral Distortion", "Dòng chảy mana bị bẻ cong bởi pháp thuật của {$winnerAgent['name']}.", 0.6);
        return "Ranh giới thực tại bị xóa nhòa. Các thực thể vô hình bắt đầu xâm nhập vào thế giới dưới sự dẫn dắt của {$winnerAgent['name']}.";
    }
}
