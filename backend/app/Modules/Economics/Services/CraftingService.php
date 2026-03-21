<?php

namespace App\Modules\Economics\Services;

use App\Modules\Economics\Entities\Inventory;
use App\Modules\Economics\ValueObjects\Item;
use App\Modules\Geography\Entities\NaturalResource;
use Illuminate\Support\Str;

class CraftingService
{
    /**
     * Chế tạo công cụ từ tài nguyên thô.
     * Cuốc đá cần 2 Gỗ + 2 Đá. Nếu đủ sẽ lấy khỏi Inventory và thêm "Tool" vào.
     * 
     * @return bool True nếu craft thành công
     */
    public function craftStoneAxe(Inventory $inventory): bool
    {
        $woodNeeded = 2.0;
        $stoneNeeded = 2.0;

        // Check có đủ không
        if ($inventory->getCategoryTotal(NaturalResource::CATEGORY_WOOD) >= $woodNeeded &&
            $inventory->getCategoryTotal(NaturalResource::CATEGORY_STONE) >= $stoneNeeded) 
        {
            // Trừ tài nguyên
            $inventory->takeItemByCategory(NaturalResource::CATEGORY_WOOD, $woodNeeded);
            $inventory->takeItemByCategory(NaturalResource::CATEGORY_STONE, $stoneNeeded);

            // Thêm Cuốc Đá
            $axe = new Item(
                id: (string) Str::uuid(),
                category: 'tool',
                quantity: 1.0,
                weightPerUnit: 2.0, // 2kg
                quality: 1.0,
                decayRatePerTick: 0.05 // Cuốc đá dùng mòn dần
            );

            $inventory->addItem($axe);
            return true;
        }

        return false;
    }
}
