<?php

namespace App\Modules\Intelligence\Entities\Archetypes;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\BaseArchetype;

class Technocrat extends BaseArchetype
{
    public function getName(): string
    {
        return 'Technocrat';
    }

    public function isEligible(World $world): bool
    {
        return ($world->axiom['material_organization'] ?? false) === true;
    }

    public function getBaseUtility(float $stability): float
    {
        return 0.6 * $stability;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        return "Trật tự và hiệu suất được ưu tiên hàng đầu.";
    }
}
