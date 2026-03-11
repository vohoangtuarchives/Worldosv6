<?php

namespace App\Services\Narrative\Strategies;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

class ParadoxNarrativeStrategy implements NarrativeStrategyInterface
{
    public function supports(string $action): bool
    {
        return $action === 'paradox_triggered' || $action === 'paradox';
    }

    public function buildPrompt(array $payload): string
    {
        $type = $payload['paradox_type'] ?? $payload['type'] ?? 'Lỗi vô định';
        $count = (int) ($payload['_count'] ?? 1);

        if ($count > 1) {
            return "Sự kiện: Hỗn mang (Chaos Paradox) — {$count} nghịch lý.\n"
                . "Loại: {$type}.\n"
                . "Yêu cầu: Miêu tả bầu trời/không gian/quy luật vật lý bị bóp méo khi nhiều nghịch lý xảy ra cùng lúc.";
        }

        return "Sự kiện: Hỗn mang (Chaos Paradox). Loại nghịch lý: {$type}.\n"
            . "Yêu cầu: Miêu tả bầu trời, không gian, hoặc các quy luật vật lý đang bị bóp méo. Hiện tượng phi logic và đáng sợ.";
    }
}
