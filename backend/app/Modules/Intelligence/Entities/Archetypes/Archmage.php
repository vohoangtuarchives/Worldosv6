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

    public function isEligible(World $world): bool
    {
        return $world->current_genre === 'wuxia' || $world->current_genre === 'modern_fantasy';
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.5;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        return "Linh khí dao động, phép tắc thiên địa thay đổi.";
    }
}
