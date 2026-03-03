<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Actions\Simulation\WavefunctionCollapseAction;
use Illuminate\Support\Facades\Log;

class ObservationInterferenceEngine
{
    public function __construct(
        protected WavefunctionCollapseAction $wavefunctionCollapseAction
    ) {}

    /**
     * Phân tích tương tác của Đệ nhất Quan sát nhân và thực thi sụp đổ hàm sóng.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        // Kiểm tra xem vũ trụ có đang bị "quan sát" gần đây không (Interference Detection)
        // Trong V6, việc truy cập API /universes/{id} sẽ cập nhật last_observed_at
        $isBeingObserved = $universe->last_observed_at && 
                           $universe->last_observed_at->diffInSeconds(now()) < 30;

        if ($isBeingObserved) {
            // Thực thi hiệu ứng can thiệp lượng tử
            $this->wavefunctionCollapseAction->execute($universe, $snapshot);
        } else {
            // Tự động phân rã áp lực quan sát theo thời gian (Entropy Recovery)
            if ($universe->observation_load > 0) {
                $decay = 0.5; // Tốc độ hồi phục thực tại tự nhiên
                $universe->update([
                    'observation_load' => max(0, $universe->observation_load - $decay)
                ]);
            }
        }

        // Cảnh báo Bão hòa Thực tại (Reality Saturation)
        if ($universe->observation_load > 10.0) {
            Log::warning("Universe {$universe->id} is reaching Reality Saturation (Load: {$universe->observation_load})");
        }
    }
}
