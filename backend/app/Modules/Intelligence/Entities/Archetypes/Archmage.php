<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class Archmage extends BaseArchetype
{
    public function getName(): string
    {
        return 'Archmage';
    }

    public function getAttractorVector(): array
    {
        return [
            'spirituality' => 0.9,
            'knowledge'    => 0.4,
            'chaos'        => 0.3,
        ];
    }

    public function isEligible(World $world): bool
    {
        return ($world->axiom['has_linh_ki'] ?? false) || ($world->axiom['has_magic'] ?? false);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): array
    {
        return [
            new \App\Modules\Intelligence\Events\ArchetypeImpactEvent(
                $universe,
                $snapshot,
                'Sóng Cổ Phép',
                'Linh khí dao động mạnh',
                0.5,
                "Linh khí dao động, phép tắc thiên địa thay đổi."
            )
        ];
    }
}
