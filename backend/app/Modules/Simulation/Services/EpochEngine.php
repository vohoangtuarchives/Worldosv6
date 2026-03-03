<?php

namespace App\Modules\Simulation\Services;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Models\Universe as UniverseModel;
use App\Models\UniverseSnapshot;
use App\Models\Epoch;
use App\Modules\Simulation\Actions\TransitionEpochAction;
use Illuminate\Support\Facades\Log;

class EpochEngine
{
    /**
     * Ngưỡng Tick mặc định để xem xét chuyển giao kỷ nguyên (ví dụ: 10,000 tick).
     */
    protected int $epochThreshold = 10000;

    public function __construct(
        protected TransitionEpochAction $transitionAction
    ) {}

    /**
     * Kiểm tra và tính toán sự chuyển giao kỷ nguyên.
     */
    public function process(UniverseEntity $universe, UniverseSnapshot $snapshot): void
    {
        $currentEpoch = Epoch::where('world_id', $universe->worldId)
            ->where('status', 'active')
            ->first();

        // Nếu chưa có kỷ nguyên nào, khởi tạo Kỷ Nguyên Khởi Nguyên
        if (!$currentEpoch) {
            $this->initializeFirstEpoch($universe, $snapshot);
            return;
        }

        $tick = $snapshot->tick;
        $relativeTick = $tick - $currentEpoch->start_tick;

        // Kiểm tra điều kiện chuyển giao:
        // 1. Vượt quá ngưỡng tick kỷ nguyên
        // 2. Entropy quá cao (thực tại rạn nứt)
        
        $entropy = $universe->entropy;
        
        if ($relativeTick >= $this->epochThreshold || ($entropy > 0.9 && $relativeTick > 2000)) {
            $this->initiateTransition($universe, $currentEpoch, $snapshot);
        }
    }

    protected function initializeFirstEpoch(UniverseEntity $universe, UniverseSnapshot $snapshot): void
    {
        $epoch = Epoch::create([
            'world_id' => $universe->worldId,
            'name' => 'Kỷ Nguyên Khởi Nguyên',
            'theme' => 'genesis',
            'description' => 'Thời đại đầu tiên của thực tại, nơi các quy luật vật lý bắt đầu hình thành.',
            'start_tick' => 0,
            'status' => 'active',
            'axiom_modifiers' => [
                'innovation_rate' => 1.1,
                'stability_bonus' => 0.05
            ]
        ]);

        Log::info("First Epoch Initialized for World {$universe->worldId}: {$epoch->name}");
    }

    protected function initiateTransition(UniverseEntity $universe, Epoch $currentEpoch, UniverseSnapshot $snapshot): void
    {
        Log::info("Initiating Epoch Transition for World {$universe->worldId} at tick {$snapshot->tick}");
        
        // Xác định chủ đề của kỷ nguyên tiếp theo dựa trên tình trạng hiện tại
        $nextTheme = $this->determineNextTheme($universe);
        
        $this->transitionAction->execute($universe, $currentEpoch, $snapshot->tick, $nextTheme);
    }

    protected function determineNextTheme(UniverseEntity $universe): array
    {
        $entropy = $universe->entropy;
        $order = $universe->stabilityIndex;
        $innovation = $universe->stateVector['innovation'] ?? 0;

        if ($entropy > 0.8) {
            return [
                'name' => 'Kỷ Nguyên Hỗn Loạn (The Age of Chaos)',
                'theme' => 'chaos',
                'description' => 'Thực tại rạn nứt, trật tự sụp đổ dưới sức nặng của sự hỗn mang.',
                'modifiers' => ['entropy_rate' => 1.5, 'trauma_multiplier' => 1.2]
            ];
        }

        if ($innovation > 0.7) {
            return [
                'name' => 'Thời Đại Ánh Sáng (The Age of Enlightenment)',
                'theme' => 'light',
                'description' => 'Trí tuệ thăng hoa, các nền văn minh chạm tay vào những bí mật tối thượng.',
                'modifiers' => ['innovation_rate' => 2.0, 'complexity_growth' => 1.3]
            ];
        }

        return [
            'name' => 'Kỷ Nguyên Trật Tự (The Age of Order)',
            'theme' => 'order',
            'description' => 'Một thời kỳ thái bình và ổn định dưới sự giám sát của các quy luật vĩnh cửu.',
            'modifiers' => ['stability_bonus' => 0.15, 'conflict_chance' => 0.5]
        ];
    }
}
