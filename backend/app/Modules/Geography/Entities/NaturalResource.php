<?php

namespace App\Modules\Geography\Entities;

use InvalidArgumentException;

/**
 * NaturalResource là một loại tài nguyên thiên nhiên gắn liền với 1 Tile.
 * (Ví dụ: Cây, Đá, Quặng sắt, Nguồn thú rừng).
 * 
 * Tài nguyên có thể mọc lại (regeneration) nếu thuộc về sinh vật (cây/thú).
 * Khoáng sản (Đá/Quặng) thì đào xong là mất vĩnh viễn (regenerationRate = 0).
 */
class NaturalResource
{
    public const CATEGORY_WOOD = 'wood';
    public const CATEGORY_STONE = 'stone';
    public const CATEGORY_FOOD = 'food'; // Trái cây, thú hoang
    public const CATEGORY_MINERAL = 'mineral'; // Sắt, đồng...

    public function __construct(
        public readonly string $id,
        public readonly string $category,
        public float $currentAmount,
        public readonly float $maxAmount,
        public readonly float $regenerationRatePerTick, // Có thể bằng 0 với khoáng sản
        public readonly float $harvestDifficulty // [1.0 -> 5.0], độ cứng để đào
    ) {
        $this->currentAmount = max(0.0, min($this->maxAmount, $this->currentAmount));
    }

    /**
     * Tiến trình phục hồi tự nhiên (được gọi ở mỗi tick bởi EnvironmentTickService)
     * 
     * @param float $weatherMultiplier (Có thể từ Weather->getRegenerationMultiplier())
     */
    public function regenerate(float $weatherMultiplier = 1.0): void
    {
        if ($this->regenerationRatePerTick <= 0 || $this->currentAmount >= $this->maxAmount) {
            return;
        }

        // Tốc độ hồi phục bị ảnh hưởng bởi thời tiết (mưa tốt, hạn hán khô kiệt)
        $actualGrowth = $this->regenerationRatePerTick * $weatherMultiplier;

        $this->currentAmount = min($this->maxAmount, $this->currentAmount + $actualGrowth);
    }

    /**
     * Agent khai thác tài nguyên từ mỏ này.
     * Trả về số lượng lấy được thực tế.
     */
    public function harvest(float $requestedAmount): float
    {
        if ($this->currentAmount <= 0) {
            return 0.0;
        }

        $harvested = min($this->currentAmount, $requestedAmount);
        $this->currentAmount -= $harvested;

        return $harvested;
    }

    public function isDepleted(): bool
    {
        return $this->currentAmount <= 0 && $this->regenerationRatePerTick <= 0;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'current_amount' => $this->currentAmount,
            'max_amount' => $this->maxAmount,
            'regeneration_rate' => $this->regenerationRatePerTick,
            'harvest_difficulty' => $this->harvestDifficulty,
        ];
    }
}
