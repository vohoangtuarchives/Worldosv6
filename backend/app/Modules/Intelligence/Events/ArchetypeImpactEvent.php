<?php

namespace App\Modules\Intelligence\Events;

use App\Models\Universe;
use App\Models\UniverseSnapshot;

class ArchetypeImpactEvent
{
    public function __construct(
        public readonly Universe $universe,
        public readonly UniverseSnapshot $snapshot,
        public readonly string $scarName,
        public readonly string $scarDesc,
        public readonly float $severity = 0.5,
        public readonly ?string $chronicleMessage = null
    ) {}
}
