<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class Warlord extends BaseArchetype
{
    public function getName(): string
    {
        return 'Warlord';
    }

    public function isEligible(World $world): bool
    {
        return ($world->axiom['entropy_rate'] ?? 1.0) > 0.6;
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.7 * (1 - $stability);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, 'Huyết Chiến', 'Một cuộc thanh trừng quy mô lớn đã diễn ra.', 0.8);
        return "Binh đao loạn lạc, kẻ mạnh sinh tồn.";
    }
}
