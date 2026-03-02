<?php

namespace App\Actions\Simulation;

use App\Models\MythScar;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class ApplyMythScarAction
{
    /**
     * Tự động sinh một Vết Sẹo (Myth Scar) cho một quy mô lãnh thổ nhất định 
     * dựa vào mức độ hỗn loạn (chaos) hiện tại.
     */
    public function execute(Universe $universe, UniverseSnapshot $savedSnapshot, array $decisionData): void
    {
        $severity = 0.5;
        $description = "Hệ quả từ sự biến động mạnh mẽ của kỷ nguyên.";
        $name = "Tàn Tích Biến Động";
        $zoneId = "Global"; // Hoặc bóc tách từ state_vector nếu có list zones

        // Trích xuất từ meta data suggestion của AI / Rules engine
        if (isset($decisionData['meta']['mutation_suggestion'])) {
            $suggestion = $decisionData['meta']['mutation_suggestion'];
            if (isset($suggestion['add_scar'])) {
                $name = $suggestion['add_scar'];
                $description = "Sẹo lịch sử do chấn động tiến hóa: " . $name;
                $severity = 0.8;
            }
        } elseif ($savedSnapshot->stability_index !== null && $savedSnapshot->stability_index < 0.2) {
            // Sụp đổ/Entropy quá cao thì sinh Di chứng
            $severity = 1.0 - $savedSnapshot->stability_index;
            $name = "Ký Ức Đổ Nát";
            $description = "Dấu vết còn sót lại khi cấu trúc trật tự rơi vào hỗn loạn tột độ.";
        } else {
            // Chưa đủ điều kiện sinh sẹo
            return;
        }

        MythScar::create([
            'universe_id'      => $universe->id,
            'zone_id'          => $zoneId,
            'name'             => $name,
            'description'      => $description,
            'severity'         => $severity,
            'decay_rate'       => 0.01 + (rand(-5, 5) * 0.001),
            'created_at_tick'  => $universe->current_tick,
            'resolved_at_tick' => null,
        ]);
    }
}
