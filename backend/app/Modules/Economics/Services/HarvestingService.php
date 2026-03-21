<?php

namespace App\Modules\Economics\Services;

use App\Modules\Geography\Entities\NaturalResource;
use App\Modules\Economics\Entities\Inventory;
use App\Modules\Economics\ValueObjects\Item;
use Illuminate\Support\Str;

class HarvestingService
{
    /**
     * Khai thác tài nguyên từ mỏ (Tile) vào tủ đồ (Inventory)
     * 
     * @param NaturalResource $resource
     * @param Inventory $inventory
     * @param float $requestedAmount Số lượng AI muốn đào (Giới hạn bởi Energy thực tế)
     * @param float $toolMultiplier Hiệu suất đào bới (Tay không: 1.0, Cuốc đá: 2.0)
     * @return float Lượng đào bới thành công
     */
    public function harvestResource(
        NaturalResource $resource, 
        Inventory $inventory, 
        float $requestedAmount, 
        float $toolMultiplier = 1.0
    ): float {
        // AI không thể đào quá sức bản thân (Weight limit)
        $weightPerUnit = $this->getWeightByCategory($resource->category);
        $maxCanCarryUnits = ($inventory->maxWeightCapacity - $inventory->getCurrentWeight()) / $weightPerUnit;
        
        // So sánh Lượng muốn đào (đã nhân tool buff) với Max có thể xách về
        $amountToAttempt = min($requestedAmount * $toolMultiplier, $maxCanCarryUnits);
        
        if ($amountToAttempt <= 0) {
            return 0.0;
        }

        // Tốc độ đào cũng phụ thuộc vào độ cứng của mỏ (Harvest Difficulty)
        $effectiveHarvest = $amountToAttempt / max(1.0, $resource->harvestDifficulty);

        $actualHarvested = $resource->harvest($effectiveHarvest);

        if ($actualHarvested > 0) {
            // Chuyển hóa Mỏ -> Vật phẩm
            $item = new Item(
                id: (string) Str::uuid(),
                category: $resource->category,
                quantity: $actualHarvested,
                weightPerUnit: $weightPerUnit,
                quality: 1.0,
                decayRatePerTick: $this->getDecayRateByCategory($resource->category) // Food hỏng, Gỗ đá không hỏng
            );

            // Tống vào kho AI
            $inventory->addItem($item);
        }

        return $actualHarvested;
    }

    private function getWeightByCategory(string $category): float
    {
        return match($category) {
            NaturalResource::CATEGORY_WOOD => 2.0, // 1 cục gỗ = 2kg
            NaturalResource::CATEGORY_STONE => 5.0, // 1 cục đá = 5kg
            NaturalResource::CATEGORY_MINERAL => 10.0, // 1 cục quặng = 10kg
            NaturalResource::CATEGORY_FOOD => 0.5, // 1 quả Berry = 0.5kg
            default => 1.0,
        };
    }

    private function getDecayRateByCategory(string $category): float
    {
        return match($category) {
            NaturalResource::CATEGORY_FOOD => 0.05, // Thực phẩm hỏng 5% mỗi tick
            default => 0.0, // Gỗ, Đá không hỏng
        };
    }
}
