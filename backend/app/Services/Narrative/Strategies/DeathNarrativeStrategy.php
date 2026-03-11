<?php

namespace App\Services\Narrative\Strategies;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

class DeathNarrativeStrategy implements NarrativeStrategyInterface
{
    public function supports(string $action): bool
    {
        return $action === 'death_by_anomaly' || $action === 'death';
    }

    public function buildPrompt(array $payload): string
    {
        $count = (int) ($payload['_count'] ?? 1);
        $samples = $payload['_samples'] ?? [$payload];
        $name = $samples[0]['agent_name'] ?? 'Vô danh';
        $arch = $samples[0]['archetype'] ?? 'Dân thường';
        $scenarios = ['Heroic', 'Mundane', 'Absurd', 'Gamer', 'Classic Truck-kun'];
        $scenario = $scenarios[array_rand($scenarios)];

        if ($count > 1) {
            return "Sự kiện: Tử thần giáng lâm (Isekai Death) — {$count} nạn nhân.\n"
                . "Mẫu: {$name} ({$arch}), phong cách '{$scenario}'.\n"
                . "Yêu cầu: Viết MỘT đoạn văn ngắn tóm tắt không khí của nhiều cái chết bất đắc kỳ tử trong cùng thời điểm (xuyên không). Giọng tùy tình huống.";
        }

        return "Sự kiện: Tử thần giáng lâm (Isekai Death).\n"
            . "Nạn nhân: {$name} (Nghề nghiệp/Bản ngã: {$arch}). Phong cách: '{$scenario}'.\n"
            . "Yêu cầu: Viết cảnh người này đang làm gì đó thì đột ngột biến mất, hoặc chết một cách bất đắc kỳ tử để xuyên không.";
    }
}
