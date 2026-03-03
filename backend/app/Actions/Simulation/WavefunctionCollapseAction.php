<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

class WavefunctionCollapseAction
{
    /**
     * Thực thi sự sụp đổ hàm sóng thực tại do hiện tượng nhiễu xạ quan sát.
     */
    public function execute(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $currentTick = (int) $snapshot->tick;
        
        // 1. Tính toán mức độ can thiệp (Intensity)
        // Càng quan sát lâu, áp lực ý thức càng cao, hàm sóng càng bị nén chặt
        $intensity = 0.2; // Tốc độ nén thực tại mỗi tick quan sát
        $newLoad = $universe->observation_load + $intensity;

        // 2. Áp dụng hiệu ứng vật lý (Intrinsic Evolution)
        // - Giảm Entropy: Sự quan sát cố định trật tự (Wavefunction collapse)
        // - Tăng Stability: Thực tại trở nên "cứng" hơn và ít biến thiên ngẫu nhiên hơn
        $universe->update([
            'observation_load' => $newLoad,
        ]);

        // Cập nhật trực tiếp vào snapshot hiện tại (không lưu vào DB ở đây, sẽ được lưu bởi simulation loop)
        $snapshot->entropy = max(0, $snapshot->entropy - ($intensity * 0.05));
        $snapshot->stability_index = min(1.0, $snapshot->stability_index + ($intensity * 0.1));

        // 3. Ghi chép Sử gia (Perceived Archive)
        // Chỉ ghi chép khi áp lực đạt đến các ngưỡng bão hòa quan trọng
        if (floor($newLoad) > floor($universe->getOriginalEntity()->observation_load ?? 0)) {
            $this->logObservationNarrative($universe, $currentTick, $newLoad);
        }

        Log::debug("Wavefunction Collapse executed for Universe {$universe->id}. New Load: {$newLoad}");
    }

    protected function logObservationNarrative(Universe $universe, int $tick, float $load): void
    {
        $narrative = "SỰ NGƯNG TRỆ CỦA CÁC KHẢ NĂNG: Áp lực từ Đệ nhất Quan sát nhân đã đạt mức " . number_format($load, 1) . " Φ. " .
                     "Các biến số ngẫu nhiên đang bị nén chặt vào một thực tại duy nhất. " .
                     "Trật tự lượng tử đang được thiết đặt một cách cưỡng bách.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'observation_interference',
            'content' => $narrative,
            'perceived_archive_snapshot' => [
                'interference_load' => $load,
                'state' => $load > 8 ? 'saturation' : 'collapse'
            ]
        ]);
    }
}
