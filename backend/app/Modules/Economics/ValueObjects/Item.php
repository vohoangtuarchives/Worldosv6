<?php

namespace App\Modules\Economics\ValueObjects;

use InvalidArgumentException;

/**
 * Item là một loại vật thể có trong Inventory của AI.
 * Dùng để tiêu thụ (Ăn, Dùng) hoặc Trao đổi (Trade).
 * Vật phẩm hữu cơ (Food) sẽ có độ hư hỏng (Decay Rate).
 */
class Item
{
    public function __construct(
        public readonly string $id,         // Ex: 'food_123', 'wood_456'
        public readonly string $category,   // Thường map với NaturalResource::CATEGORY_*
        public float $quantity,             // Khối lượng/Số lượng
        public readonly float $weightPerUnit, // Tính sức chứa Inventory
        public float $quality = 1.0,        // [0, 1] - Nếu về 0 là item bị hỏng
        public readonly float $decayRatePerTick = 0.0 // Tốc độ hỏng (Ví dụ: Food = 0.05, Đá = 0)
    ) {
        if ($this->quantity < 0) {
            throw new InvalidArgumentException("Item quantity cannot be negative");
        }
    }

    /**
     * Sụt giảm chất lượng đồ đạc (vd: Nho chín bị héo dần)
     * Thức ăn hỏng sẽ bị vứt đi hoặc không thể tiêu thụ.
     */
    public function age(): void
    {
        if ($this->decayRatePerTick > 0) {
            $this->quality = max(0.0, $this->quality - $this->decayRatePerTick);
            
            // Nếu đồ hỏng 100%, số lượng bằng 0 (tan biến/vứt đi)
            if ($this->quality <= 0.0) {
                $this->quantity = 0.0;
            }
        }
    }

    public function getTotalWeight(): float
    {
        return $this->quantity * $this->weightPerUnit;
    }

    public function consume(float $amount): float
    {
        $amountToConsume = min($this->quantity, $amount);
        $this->quantity -= $amountToConsume;
        
        return $amountToConsume;
    }

    public function mergeWith(Item $other): void
    {
        // 2 khối lượng gộp chung. Chất lượng mới lấy bình quân gia quyền.
        if ($this->category !== $other->category) {
            throw new InvalidArgumentException("Cannot merge items of different category");
        }

        $totalQty = $this->quantity + $other->quantity;
        if ($totalQty > 0) {
            $this->quality = (($this->quality * $this->quantity) + ($other->quality * $other->quantity)) / $totalQty;
        }

        $this->quantity = $totalQty;
        $other->quantity = 0; // Đã chuyển sang item này
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'quantity' => $this->quantity,
            'weight_per_unit' => $this->weightPerUnit,
            'quality' => $this->quality,
            'decay_rate' => $this->decayRatePerTick,
        ];
    }
}
