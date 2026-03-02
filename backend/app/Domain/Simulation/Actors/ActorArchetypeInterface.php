<?php

namespace App\Domain\Simulation\Actors;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

interface ActorArchetypeInterface
{
    /**
     * Tên hiển thị của nguyên mẫu (VD: Technocrat, Warlord).
     */
    public function getName(): string;

    /**
     * Kiểm tra xem Actor này có phù hợp để xuất hiện trong thế giới này không.
     */
    public function isEligible(World $world): bool;

    /**
     * Điểm thưởng/phạt dựa trên trạng thái hiện tại (vd: ổn định hay hỗn loạn).
     */
    public function getBaseUtility(float $stability): float;

    /**
     * Áp dụng tác động lên vũ trụ khi Actor này thắng cuộc.
     * Trả về chuỗi mô tả kết quả.
     */
    public function applyImpact(Universe $universe, UniverseSnapshot $snapshot, array $winnerAgent): string;
}
