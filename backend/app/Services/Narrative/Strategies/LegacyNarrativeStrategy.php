<?php

namespace App\Services\Narrative\Strategies;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

/**
 * Fallback for legacy_event and any action without a dedicated strategy.
 */
class LegacyNarrativeStrategy implements NarrativeStrategyInterface
{
    public function supports(string $action): bool
    {
        return true;
    }

    public function buildPrompt(array $payload): string
    {
        $action = $payload['action'] ?? 'unknown';
        $desc = $payload['description'] ?? null;
        $count = (int) ($payload['_count'] ?? 1);

        if ($desc !== null && $desc !== '') {
            if ($count > 1) {
                return "Sự kiện: Hệ thống lịch sử — {$count} sự kiện tương tự.\nDữ liệu: {$desc}\nYêu cầu: Viết MỘT đoạn tóm tắt sống động cho cả nhóm sự kiện.";
            }
            return "Sự kiện: Hệ thống lịch sử.\nDữ liệu: {$desc}\nYêu cầu: Viết lại bằng ngôn từ sống động, trau chuốt. Giữ nguyên ý nghĩa.";
        }

        $json = json_encode($payload);
        return "Sự kiện: {$action}.\nDữ liệu thô: {$json}\nYêu cầu: Mường tượng và miêu tả một viễn cảnh ngắn gọn từ dữ liệu này.";
    }
}
