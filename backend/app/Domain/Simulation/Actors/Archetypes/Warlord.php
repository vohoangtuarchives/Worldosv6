<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class Warlord extends BaseArchetype
{
    public function getName(): string { return 'Warlord'; }

    public function isEligible(World $world): bool
    {
        // Warlord có thể xuất hiện ở bất cứ đâu có mâu thuẫn vũ lực
        return true;
    }

    public function getBaseUtility(float $stability): float
    {
        // Warlord cực kỳ mạnh khi ổn định thấp
        return 1.6 - $stability;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, "Iron Discipline", "Các Zone lân cận bị buộc phải huy động tài nguyên cho bộ máy chiến tranh của {$winnerAgent['name']}.", 0.5);
        return "Sự ổn định được thiết lập bằng họng súng. {$winnerAgent['name']} đã thống nhất các vùng lãnh thổ tản mát thành một khối quân sự thống nhất.";
    }
}
