<?php

namespace App\Modules\Economics\Services;

use App\Modules\Economics\Entities\Inventory;
use App\Modules\Economics\ValueObjects\TradeOffer;
use App\Modules\Geography\Entities\NaturalResource;

class BarterMarketResolver
{
    /**
     * AI (Target) xem xét lời gạ gẫm đổi đồ (Offer).
     * Yêu cầu: The Target MUST gain more subjective value than they lose.
     * 
     * @param Inventory $targetInventory Túi đồ của kẻ bị mời chào
     * @param TradeOffer $offer Lời gọi đò
     * @param float $targetHunger Mức độ đói khát (0 -> 1.0) từ Psychology layer
     * @param float $targetSafetyNeed Mức độ cần vật liệu xây trú ẩn (0 -> 1.0)
     * @param float $relationTrust Mức độ tin tưởng (-1 -> 1) của Target với Owner
     * @return bool Có chốt deal hay không?
     */
    public function evaluateOffer(
        Inventory $targetInventory,
        TradeOffer $offer,
        float $targetHunger,
        float $targetSafetyNeed,
        float $relationTrust
    ): bool {
        // AI ghét cay ghét đắng -> Không thèm giao dịch
        if ($relationTrust < -0.5) {
            return false;
        }

        // Tính tổng giá trị TÍCH CỰC mà AI sẽ NHẬN ĐƯỢC
        $gainedValue = 0.0;
        foreach ($offer->giveItems as $itemSnapshot) {
            $gainedValue += $this->calculateSubjectiveValue(
                $itemSnapshot['category'], 
                $itemSnapshot['quantity'], 
                $targetHunger, 
                $targetSafetyNeed
            );
        }

        // Tính tổng giá trị MÀ AI PHẢI MẤT ĐI (Cái offer yêu cầu)
        $lostValue = 0.0;
        foreach ($offer->requestItems as $req) {
            // Kiểm tra AI có đủ hàng để trả không
            if ($targetInventory->getCategoryTotal($req['category']) < $req['quantity']) {
                return false; // Không đủ tiền/hành
            }

            $lostValue += $this->calculateSubjectiveValue(
                $req['category'], 
                $req['quantity'], 
                $targetHunger, 
                $targetSafetyNeed
            );
        }

        // Yếu tố Trust làm "giảm giá" kỳ vọng
        // Nếu rất tin tưởng (Trust = 1), AI có thể chấp nhận lỗ nhẹ 10%
        // Nếu nghi ngờ (Trust = -0.4), AI đòi lãi 40% mới chịu đổi
        $requiredProfitMargin = 1.0 - ($relationTrust * 0.1);

        return $gainedValue >= ($lostValue * $requiredProfitMargin);
    }

    /**
     * Mấu chốt của Hệ thống Kinh tế Emergent: KHÔNG CÓ GIÁ CỐ ĐỊNH (No Fixed Prices).
     * Thức ăn có giá vô cực với kẻ sắp chết đói. Nhưng vô giá trị với người no.
     */
    private function calculateSubjectiveValue(string $category, float $quantity, float $hunger, float $safetyNeed): float
    {
        $baseValue = $quantity; // 1 unit = 1 base value

        return match ($category) {
            NaturalResource::CATEGORY_FOOD => $baseValue * (1.0 + ($hunger * 5.0)), // Đói 1.0 -> Giá Food x6
            NaturalResource::CATEGORY_WOOD, 
            NaturalResource::CATEGORY_STONE => $baseValue * (1.0 + ($safetyNeed * 3.0)), // Cần nhà -> Giá vật liệu x4
            NaturalResource::CATEGORY_MINERAL => $baseValue * 2.0, // Quặng luôn có tính đầu cơ/crafting -> Base cao
            default => $baseValue,
        };
    }
}
