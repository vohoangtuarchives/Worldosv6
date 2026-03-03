<?php

namespace App\Modules\Intelligence\Entities;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Actions\Simulation\ApplyMythScarAction;
use App\Modules\Intelligence\Entities\Contracts\ActorArchetypeInterface;

abstract class BaseArchetype implements ActorArchetypeInterface
{
    public function __construct(
        protected ApplyMythScarAction $applyMythScarAction
    ) {}

    abstract public function getName(): string;

    abstract public function isEligible(World $world): bool;

    abstract public function getBaseUtility(float $stability): float;

    /**
     * Tiện ích hỗ trợ tạo sẹo lịch sử.
     */
    protected function createScar(Universe $universe, UniverseSnapshot $snapshot, string $name, string $desc, float $severity = 0.5): void
    {
        $this->applyMythScarAction->execute($universe, $snapshot, [
            'meta' => [
                'mutation_suggestion' => [
                    'add_scar' => $name,
                    'scar_description' => $desc,
                    'scar_severity' => $severity
                ]
            ]
        ]);
    }

    /**
     * Mặc định tác động chung: để lại một dấu ấn trong Chronicle.
     */
    abstract public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string;
}
