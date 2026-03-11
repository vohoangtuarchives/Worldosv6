<?php

namespace App\Services\Narrative\Strategies;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

class RebirthNarrativeStrategy implements NarrativeStrategyInterface
{
    public function supports(string $action): bool
    {
        return $action === 'rebirth_with_cheat' || $action === 'rebirth';
    }

    public function buildPrompt(array $payload): string
    {
        $count = (int) ($payload['_count'] ?? 1);
        $samples = $payload['_samples'] ?? [$payload];
        $name = $samples[0]['agent_name'] ?? 'Vô danh';
        $cheat = $samples[0]['cheat_granted'] ?? 'Không rõ';

        if ($count > 1) {
            return "Sự kiện: Trùng sinh (Isekai Rebirth) — {$count} kẻ ngoại đạo.\n"
                . "Mẫu quà: {$cheat}.\n"
                . "Yêu cầu: Viết MỘT đoạn tóm tắt không khí nhiều người từ không gian rớt xuống thực tại mới trong cùng thời điểm.";
        }

        return "Sự kiện: Trùng sinh (Isekai Rebirth). Nhân vật: {$name}. Món quà: {$cheat}.\n"
            . "Yêu cầu: Viết cảnh người này từ không gian rớt xuống thực tại mới. Có thể hạ cánh hoành tráng hoặc nhếch nhác. Nhân vật nhận ra mình có dị năng [{$cheat}].";
    }
}
