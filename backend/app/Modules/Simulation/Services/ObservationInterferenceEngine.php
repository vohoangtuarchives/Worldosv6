<?php

namespace App\Modules\Simulation\Services;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Modules\Simulation\Actions\WavefunctionCollapseAction;
use Illuminate\Support\Facades\Log;

class ObservationInterferenceEngine
{
    public function __construct(
        protected WavefunctionCollapseAction $wavefunctionCollapseAction
    ) {}

    /**
     * Phân tích tương tác của Đệ nhất Quan sát nhân và thực thi sụp đổ hàm sóng.
     */
    public function process(UniverseEntity $universe, int $tick, bool $isBeingObserved): void
    {
        if ($isBeingObserved) {
            // Thực thi hiệu ứng can thiệp lượng tử
            $this->wavefunctionCollapseAction->execute($universe, $tick);
        } else {
            // Tự động phân rã áp lực quan sát theo thời gian (Entropy Recovery)
            if ($universe->observationLoad > 0) {
                $decay = 0.5; // Tốc độ hồi phục thực tại tự nhiên
                $universe->decayObservationLoad($decay);
            }
        }

        // Cảnh báo Bão hòa Thực tại (Reality Saturation)
        if ($universe->observationLoad > 10.0) {
            Log::warning("Universe {$universe->id} is reaching Reality Saturation (Load: {$universe->observationLoad})");
        }
    }
}
