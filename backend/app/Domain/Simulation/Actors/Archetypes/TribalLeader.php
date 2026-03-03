<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class TribalLeader extends BaseArchetype
{
    public function getName(): string { return 'Tù Trưởng'; }

    public function isEligible(World $world): bool
    {
        // Tù trưởng xuất hiện ở giai đoạn sơ khai hoặc khi mâu thuẫn sắc tộc cao
        return true;
    }

    public function getBaseUtility(float $stability): float
    {
        // Tù trưởng mạnh mẽ nhất trong thời kỳ hỗn loạn để tập hợp lực lượng
        return 1.2 - ($stability * 0.8);
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        $this->createScar($universe, $snapshot, "Tribal Honor", "Lòng tự tôn bộ lạc trỗi dậy mạnh mẽ dưới sự dẫn dắt của {$winnerAgent['name']}.", 0.4);
        
        return "Tù trưởng {$winnerAgent['name']} đã thống nhất bộ lạc bằng ý chí sắt đá, tăng cường sự đoàn kết nội bộ nhưng đồng thời làm gia tăng căng thẳng với các thế lực ngoại vi.";
    }
}
