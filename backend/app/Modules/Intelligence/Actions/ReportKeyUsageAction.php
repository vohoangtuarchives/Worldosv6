<?php

namespace App\Modules\Intelligence\Actions;

use App\Models\AiKeyPool;
use Carbon\Carbon;

class ReportKeyUsageAction
{
    /**
     * Cập nhật trạng thái của Key sau khi gọi API.
     * 
     * @param AiKeyPool $key
     * @param int|null $errorCode Mã lỗi (nếu có, e.g. 429)
     * @param array $metadata Thông tin bổ sung
     * @return void
     */
    public function handle(AiKeyPool $key, ?int $errorCode = null, array $metadata = []): void
    {
        $key->increment('usage_count');
        $key->last_used_at = now();

        // Xử lý lỗi Rate Limit (429)
        if ($errorCode === 429) {
            // Mặc định cooldown 1 giờ cho key free, 15 phút cho premium (có thể điều chỉnh)
            $cooldownMinutes = ($key->tier === 'free') ? 60 : 15;
            $key->cooldown_until = now()->addMinutes($cooldownMinutes);
            $key->status = 'cooldown';
        } else {
            // Nếu dùng thành công (hoặc lỗi khác không phải rate limit), quay lại trạng thái active
            if ($key->status === 'cooldown' && (!$key->cooldown_until || $key->cooldown_until <= now())) {
                $key->status = 'active';
            }
        }

        if (!empty($metadata)) {
            $key->metadata = array_merge($key->metadata ?? [], $metadata);
        }

        $key->save();
    }
}
