<?php

namespace App\Modules\Economics\ValueObjects;

use InvalidArgumentException;

/**
 * TradeOffer đại diện cho một thông điệp gạ đổi đồ giữa 2 Actor (Barter System).
 * AI sẽ so sánh "Giá trị cốt lõi" dự kiến (Subjective Value) của mớ đồ nhận được 
 * với mớ đồ cho đi, cộng trừ yếu tố thân thiết (Trust) để quyết định.
 */
class TradeOffer
{
    public function __construct(
        public readonly string $actorId,      // Ai chủ động đưa Offer
        public readonly array $giveItems,     // Các món đồ mang qua giao dịch (array of Item snapshot)
        public readonly array $requestItems,  // Yêu cầu nhận lại (vd: ['category' => 'food', 'quantity' => 10])
        public readonly int $createdAtTick
    ) {
    }

    public function toArray(): array
    {
        return [
            'actor_id' => $this->actorId,
            'give_items' => $this->giveItems, // Assuming pre-converted to array snapshot
            'request_items' => $this->requestItems,
            'created_at_tick' => $this->createdAtTick,
        ];
    }
}
