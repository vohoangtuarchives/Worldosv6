<?php

namespace App\Modules\WorldOS\Services;

use App\Models\AiKeyPool;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class KeyRotationService
{
    /**
     * Lấy Key tốt nhất cho Provider cụ thể.
     */
    public function getBestKey(string $provider): ?object
    {
        // 1. Tìm các key đang ACTIVE và không trong trạng thái Cooldown
        $key = AiKeyPool::active()
            ->where('provider', $provider)
            ->orderBy('is_free', 'desc') // Ưu tiên Key miễn phí trước
            ->orderBy('usage_count', 'asc') // Load Balance: Key nào dùng ít hơn thì chọn
            ->first();

        if (!$key) {
            Log::warning("WorldOS [KeyRotation]: Không tìm thấy Key khả dụng cho Provider: {$provider}");
            return null;
        }

        // Giải mã Key trước khi trả về
        try {
            $decrypted = Crypt::decryptString($key->key_encrypted);
            
            // Cập nhật thống kê sử dụng
            $key->increment('usage_count');
            $key->update(['last_used_at' => now()]);

            return (object) [
                'id' => $key->id,
                'value' => $decrypted,
                'provider' => $key->provider,
                'label' => $key->label,
            ];
        } catch (\Exception $e) {
            Log::error("WorldOS [KeyRotation]: Lỗi giải mã Key ID {$key->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Báo cáo lỗi Rate Limit cho một Key để kích hoạt Cooldown.
     */
    public function reportRateLimit(int $keyId, int $cooldownMinutes = 60): void
    {
        $key = AiKeyPool::find($keyId);
        if ($key) {
            $key->update([
                'status' => 'cooldown',
                'cooldown_until' => now()->addMinutes($cooldownMinutes)
            ]);
            Log::info("WorldOS [KeyRotation]: Key #{$keyId} được đưa vào COOLDOWN trong {$cooldownMinutes} phút.");
        }
    }

    /**
     * Nạp Key mới vào hệ sinh thái.
     */
    public function registerKey(string $provider, string $plainKey, bool $isFree = true, string $label = null): void
    {
        AiKeyPool::create([
            'provider' => $provider,
            'label' => $label,
            'key_encrypted' => Crypt::encryptString($plainKey),
            'is_free' => $isFree,
            'status' => 'active'
        ]);
    }
}
