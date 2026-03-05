<?php

namespace App\Domain\Simulation\Actors;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Actions\Simulation\ApplyMythScarAction;
use Illuminate\Support\Facades\DB;

abstract class BaseArchetype implements ActorArchetypeInterface
{
    public function __construct() {}

    abstract public function getName(): string;

    abstract public function isEligible(World $world): bool;

    abstract public function getBaseUtility(float $stability): float;

    /**
     * Tiện ích hỗ trợ tạo sẹo lịch sử.
     */
    protected function createScar(Universe $universe, UniverseSnapshot $snapshot, string $name, string $desc, float $severity = 0.5): void
    {
        event(new \App\Modules\Intelligence\Events\ArchetypeImpactEvent(
            $universe,
            $snapshot,
            $name,
            $desc,
            $severity
        ));
    }

    /**
     * Mặc định tác động chung: để lại một dấu ấn trong Chronicle (handled by caller).
     */
    abstract public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string;
}
