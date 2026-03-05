<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class RogueAI extends BaseArchetype
{
    public function getName(): string
    {
        return 'RogueAI';
    }

    public function isEligible(World $world): bool
    {
        return ($world->current_genre === 'cyberpunk' || $world->current_genre === 'urban');
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.8 * (1 - $stability);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): array
    {
        return [
            new \App\Modules\Intelligence\Events\ArchetypeImpactEvent(
                $universe,
                $snapshot,
                'Mạng Ma',
                'Hệ thống bị lây nhiễm virus lạ.',
                0.9,
                "Dữ liệu là vũ khí, mã nguồn là xiềng xích."
            )
        ];
    }
}
