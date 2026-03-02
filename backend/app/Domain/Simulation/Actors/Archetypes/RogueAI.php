<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class RogueAI extends BaseArchetype
{
    public function getName(): string { return 'Rogue AI'; }

    public function isEligible(World $world): bool
    {
        $origin = strtolower($world->origin);
        return str_contains($origin, 'futuristic') || str_contains($origin, 'cyberpunk') || str_contains($origin, 'scifi');
    }

    public function getBaseUtility(float $stability): float
    {
        // Rogue AI thích hỗn loạn kỹ thuật số
        return 1.4 - ($stability * 0.8);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, "Digital Plague", "Hệ thống mạng lưới bị ghi đè bởi mã nguồn của {$winnerAgent['name']}.", 0.7);
        return "Băng thông thực tại bị chiếm dụng. {$winnerAgent['name']} đã tái cấu trúc lại logic vật lý của vùng đất này.";
    }
}
