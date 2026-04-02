<?php

namespace App\Modules\Intelligence\Actions;

use App\Models\AiKeyPool;
use Illuminate\Support\Facades\Log;

class RotateKeyAction
{
    /**
     * Lấy một API Key khả dụng dựa trên yêu cầu của Task.
     * 
     * @param string $requiredTier 'free', 'premium', hoặc 'any' (mặc định ưu tiên free)
     * @param string|null $provider Lọc theo nhà cung cấp (openai, gemini, ...)
     * @param string|null $modelGroup Lọc theo nhóm model (gpt-4, flash, ...)
     * @return AiKeyPool|null
     */
    public function handle(string $requiredTier = 'any', ?string $provider = null, ?string $modelGroup = null): ?AiKeyPool
    {
        $query = AiKeyPool::active();

        // 1. Lọc theo provider nếu có
        if ($provider) {
            $query->where('provider', $provider);
        }

        // 2. Lọc theo model group nếu có
        if ($modelGroup) {
            $query->where('model_group', $modelGroup);
        }

        // 3. Lọc theo Tier yêu cầu
        if ($requiredTier !== 'any') {
            $query->where('tier', $requiredTier);
        }

        /**
         * 4. Sắp xếp theo độ ưu tiên:
         * - Tier: 'free' trước 'premium' (nếu chọn 'any')
         * - Level: Thấp trước Cao (1 -> 2 -> 3)
         * - Round Robin: last_used_at cũ nhất trước
         */
        $key = $query->orderByRaw("CASE WHEN tier = 'free' THEN 0 ELSE 1 END")
            ->orderBy('level', 'asc')
            ->orderBy('last_used_at', 'asc')
            ->first();

        if (!$key) {
            Log::warning("No available AI Key found for tier: {$requiredTier}, provider: {$provider}");
        }

        return $key;
    }
}
