<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;
use App\Models\SupremeEntity;
use Illuminate\Support\Facades\Log;

class CausalCorrectionEngine
{
    /**
     * Phân tích và thực thi tiến trình tái cân bằng nhân quả để duy trì tính toàn vẹn của vũ trụ.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $entities = SupremeEntity::where('universe_id', $universe->id)->get();

        foreach ($entities as $entity) {
            // Nợ nhân quả (Causal Debt) - Tính toán sự sai lệch thực tại do thực thể tối cao gây ra
            $causalDebt = abs($entity->karma); 

            // Nếu nợ vượt ngưỡng ổn định (100 Φ), thực hiện tái cấu trúc
            if ($causalDebt > 100) {
                $this->triggerCorrection($entity, $universe, (int)$snapshot->tick);
            }
        }
    }

    protected function triggerCorrection(SupremeEntity $entity, Universe $universe, int $tick): void
    {
        // Hiệu ứng Tái cân bằng tính toàn vẹn (Integrity Rebalancing)
        $correctionMagnitude = abs($entity->karma) * 0.5;
        
        // Giảm gánh nặng hệ thống bằng cách phân rã bớt quyền năng của thực thể
        $entity->update([
            'karma' => $entity->karma * 0.1, // Hóa giải phần lớn nợ
            'power_level' => max(1, $entity->power_level - ($correctionMagnitude * 0.1))
        ]);

        $narrative = "TÁI CÂN BẰNG TÍNH TOÀN VẸN: Thực thể [{$entity->name}] đã tích lũy nợ nhân quả vượt quá hằng số ổn định của vũ trụ. " .
                     "Một tiến trình tự điều chỉnh thực tại đã phát động, hóa giải nợ và tái lập cấu trúc nhân quả trung tính.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'causal_correction',
            'content' => $narrative,
            'perceived_archive_snapshot' => [
                'rebalanced_entity' => $entity->name,
                'correction_magnitude' => $correctionMagnitude
            ]
        ]);

        Log::info("Causal Correction executed for Entity [{$entity->name}] in Universe {$universe->id}");
    }
}
