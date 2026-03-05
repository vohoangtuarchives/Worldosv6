<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class VillageElder extends BaseArchetype
{
    public function getName(): string
    {
        return 'VillageElder';
    }

    public function isEligible(World $world): bool
    {
        return true;
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.4 * $stability;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): array
    {
        return [
            new \App\Modules\Intelligence\Events\ArchetypeImpactEvent(
                $universe,
                $snapshot,
                'Thư Viện Cổ',
                'Kinh nghiệm truyền lại cho thế hệ sau.',
                0.2,
                "Kinh nghiệm là tài sản quý báu nhất của bộ lạc."
            )
        ];
    }
}
