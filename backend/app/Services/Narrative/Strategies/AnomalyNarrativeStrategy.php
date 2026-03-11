<?php

namespace App\Services\Narrative\Strategies;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

class AnomalyNarrativeStrategy implements NarrativeStrategyInterface
{
    public function supports(string $action): bool
    {
        return $action === 'anomaly_spawned' || $action === 'anomaly';
    }

    public function buildPrompt(array $payload): string
    {
        $type = $payload['anomaly_type'] ?? $payload['type'] ?? 'Dị thường';
        $details = json_encode($payload['details'] ?? $payload['_samples'][0]['details'] ?? []);
        $count = (int) ($payload['_count'] ?? 1);

        if ($count > 1) {
            return "Sự kiện: Dị thường phát sinh — {$count} lần. Loại: {$type}.\n"
                . "Yêu cầu: Viết như ghi chép kinh hoàng của người dân chứng kiến nhiều dị thường trồi lên từ hư không trong cùng thời điểm.";
        }

        return "Sự kiện: Dị thường phát sinh. Loại: {$type}. Chi tiết: {$details}.\n"
            . "Yêu cầu: Viết như ghi chép kinh hoàng của người dân chứng kiến sự việc trồi lên từ hư không.";
    }
}
