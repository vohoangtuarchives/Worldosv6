<?php

namespace App\Modules\Intelligence\Entities;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Intelligence\Entities\Contracts\ActorArchetypeInterface;

abstract class BaseArchetype implements ActorArchetypeInterface
{
    abstract public function getName(): string;

    abstract public function isEligible(World $world): bool;

    abstract public function getBaseUtility(float $stability): float;

    /**
     * Tiện ích hỗ trợ tạo sẹo lịch sử (qua Domain Event).
     */
    protected function createScarEvent(Universe $universe, UniverseSnapshot $snapshot, string $name, string $desc, float $severity = 0.5): \App\Modules\Intelligence\Events\ArchetypeImpactEvent
    {
        return new \App\Modules\Intelligence\Events\ArchetypeImpactEvent(
            universe: $universe,
            snapshot: $snapshot,
            scarName: $name,
            scarDesc: $desc,
            severity: $severity
        );
    }

    /**
     * Mặc định tác động chung: trả về mảng các event cần dispatch, hoặc cấu trúc dữ liệu mô tả impact.
     * Để không break code cũ, ta có thể giữ interface cũ, nhưng lý tưởng là trả về array các objects
     * cho Engine gọi Event::dispatch().
     */
    abstract public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): array;
}
