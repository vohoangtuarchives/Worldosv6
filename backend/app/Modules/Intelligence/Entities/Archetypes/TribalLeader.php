<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class TribalLeader extends BaseArchetype
{
    public function getName(): string
    {
        return 'TribalLeader';
    }

    public function isEligible(World $world): bool
    {
        return true;
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.6;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        return "Sức mạnh tập thể vượt qua mọi rào cản.";
    }
}
