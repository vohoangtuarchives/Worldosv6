<?php

namespace App\Modules\Economics\Entities;

use App\Modules\Economics\ValueObjects\Item;
use InvalidArgumentException;

class Inventory
{
    /** @var array<string, Item> */
    private array $items = [];

    public function __construct(
        public readonly string $actorId,
        public readonly float $maxWeightCapacity = 50.0 // AI mang vác được max 50 kg
    ) {
    }

    /**
     * Thêm Item vào giỏ. Nếu cùng loại (category) sẽ gộp lại để tiết kiệm slot.
     */
    public function addItem(Item $newItem): bool
    {
        // Kiểm tra quá tải
        if ($this->getCurrentWeight() + $newItem->getTotalWeight() > $this->maxWeightCapacity) {
            // Không thể mang thêm
            return false;
        }

        // Tìm item cùng category để merge
        foreach ($this->items as $id => $existingItem) {
            if ($existingItem->category === $newItem->category && $existingItem->decayRatePerTick === $newItem->decayRatePerTick) {
                $existingItem->mergeWith($newItem);
                return true;
            }
        }

        // Thêm item mới hoàn toàn
        $this->items[$newItem->id] = $newItem;
        return true;
    }

    /**
     * Lấy bớt số lượng tài nguyên khỏi túi (để tiêu thụ hoặc trade)
     */
    public function takeItemByCategory(string $category, float $amount): float
    {
        $taken = 0.0;
        $remainingNeeded = $amount;

        foreach ($this->items as $id => $item) {
            if ($item->category === $category && $item->quantity > 0) {
                $consumeAmount = $item->consume($remainingNeeded);
                $taken += $consumeAmount;
                $remainingNeeded -= $consumeAmount;

                // Xóa slot túi nếu rỗng
                if ($item->quantity <= 0) {
                    unset($this->items[$id]);
                }

                if ($remainingNeeded <= 0) {
                    break;
                }
            }
        }

        return $taken;
    }

    public function getCurrentWeight(): float
    {
        $weight = 0.0;
        foreach ($this->items as $item) {
            $weight += $item->getTotalWeight();
        }
        return $weight;
    }

    public function getCategoryTotal(string $category): float
    {
        $total = 0.0;
        foreach ($this->items as $item) {
            if ($item->category === $category) {
                $total += $item->quantity;
            }
        }
        return $total;
    }

    public function hasCapacityFor(float $extraWeight): bool
    {
        return ($this->getCurrentWeight() + $extraWeight) <= $this->maxWeightCapacity;
    }

    /**
     * Gọi khi Tick, làm thức ăn/đồ dùng hỏng đi.
     */
    public function tickDecay(): void
    {
        foreach ($this->items as $id => $item) {
            $item->age();
            if ($item->quantity <= 0) {
                unset($this->items[$id]); // Quăng đồ hỏng
            }
        }
    }

    public function getItems(): array
    {
        return $this->items;
    }

    public function toArray(): array
    {
        return [
            'actor_id' => $this->actorId,
            'max_capacity' => $this->maxWeightCapacity,
            'current_weight' => $this->getCurrentWeight(),
            'items' => array_map(fn(Item $i) => $i->toArray(), $this->items)
        ];
    }
}
