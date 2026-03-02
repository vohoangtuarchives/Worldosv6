<?php

namespace App\Domain\Simulation\Actors\Archetypes;

use App\Domain\Simulation\Actors\BaseArchetype;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class Technocrat extends BaseArchetype
{
    public function getName(): string { return 'Technocrat'; }

    public function isEligible(World $world): bool
    {
        // Technocrat cần một nền tảng văn minh nhất định để hoạt động
        return true;
    }

    public function getBaseUtility(float $stability): float
    {
        // Technocrat mạnh nhất khi thế giới đang phát triển ổn định
        return $stability * 1.5;
    }

    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string
    {
        return "Sự hiệu quả trên hết. {$winnerAgent['name']} đã áp dụng các thuật toán quản lý mới, tối ưu hóa dòng chảy tài nguyên nhưng tạo ra khoảng cách lớn về quyền lực.";
    }
}
