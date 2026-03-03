<?php

namespace App\Modules\Intelligence\Entities\Contracts;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

interface ActorArchetypeInterface
{
    public function getName(): string;
    
    public function isEligible(World $world): bool;
    
    public function getBaseUtility(float $stability): float;
    
    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string;
}
