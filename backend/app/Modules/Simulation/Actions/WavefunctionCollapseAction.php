<?php

namespace App\Modules\Simulation\Actions;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

class WavefunctionCollapseAction
{
    public function __construct(
        private UniverseRepositoryInterface $universeRepository
    ) {}

    /**
     * Thực thi sự sụp đổ hàm sóng thực tại do hiện tượng nhiễu xạ quan sát.
     */
    public function execute(UniverseEntity $universe, int $tick): void
    {
        $oldLoad = $universe->observationLoad;
        
        // 1. Áp dụng logic tại Domain Entity
        $intensity = 0.2; 
        $universe->applyObservationInterference($intensity);

        // 2. Persist
        $this->universeRepository->save($universe);

        // 3. Ghi chép Sử gia
        if (floor($universe->observationLoad) > floor($oldLoad)) {
            $this->logObservationNarrative($universe, $tick);
        }

        Log::debug("Wavefunction Collapse executed for Universe {$universe->id}. New Load: {$universe->observationLoad}");
    }

    protected function logObservationNarrative(UniverseEntity $universe, int $tick): void
    {
        $narrative = "SỰ NGƯNG TRỆ CỦA CÁC KHẢ NĂNG: Áp lực từ Đệ nhất Quan sát nhân đã đạt mức " . number_format($universe->observationLoad, 1) . " Φ. " .
                     "Các biến số ngẫu nhiên đang bị nén chặt vào một thực tại duy nhất. " .
                     "Trật tự lượng tử đang được thiết đặt một cách cưỡng bách.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'observation_interference',
            'content' => $narrative,
            'perceived_archive_snapshot' => [
                'interference_load' => $universe->observationLoad,
                'state' => $universe->observationLoad > 8 ? 'saturation' : 'collapse'
            ]
        ]);
    }
}
