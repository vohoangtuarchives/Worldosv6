<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Actions\Simulation\RecordEventHorizonAction;
use Illuminate\Support\Facades\Log;

class TrajectoryModelingEngine
{
    public function __construct(
        protected RecordEventHorizonAction $recordEventHorizonAction
    ) {}

    /**
     * Phân tích quỹ đạo nhân quả của vũ trụ và ghi nhận các chân trời sự kiện.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $currentTick = (int) $snapshot->tick;
        
        // 1. Phân tích điểm tới hạn Entropy
        if ($universe->getEntropy() > 0.8 && ! $this->hasActiveTrajectory($universe, 'entropy_collapse')) {
            $this->recordEventHorizonAction->execute($universe, $currentTick, [
                'phenomenon_description' => "Đồ thị Entropy đang tiến tới điểm kỳ dị, đe dọa làm tan rã cấu trúc vật chất.",
                'convergence_type' => 'entropy_collapse',
                'probability' => 0.75,
                'distance' => 100
            ]);
        }

        // 2. Phân tích xung đột nhân quả vĩ mô (Causal Debt)
        // Trong V6, nghiệp chướng được hiểu là nợ nhân quả từ các thực thể tối cao
        /** @var \App\Models\SupremeEntity|null $mostEvil */
        $mostEvil = $universe->supremeEntities()->where('karma', '<', -50)->orderBy('karma', 'asc')->first();
        if ($mostEvil && ! $this->hasActiveTrajectory($universe, 'causal_rebalancing')) {
            $this->recordEventHorizonAction->execute($universe, $currentTick, [
                'phenomenon_description' => "Thực thể [{$mostEvil->name}] đang tạo ra một vùng nhiễu loạn nhân quả cực lớn. Một tiến trình tái cân bằng thực tại đang hội tụ.",
                'convergence_type' => 'causal_rebalancing',
                'probability' => 0.9,
                'distance' => 50
            ]);
        }

        // 3. Phân tích hiện tượng bão hòa thực tại (Reality Saturation)
        if ($universe->observation_load > 8.0 && ! $this->hasActiveTrajectory($universe, 'reality_saturation')) {
            $this->recordEventHorizonAction->execute($universe, $currentTick, [
                'phenomenon_description' => "Áp lực quan sát đang vượt ngưỡng chịu tải. Thực tại có dấu hiệu bão hòa và sụp đổ cấu trúc biến thiên.",
                'convergence_type' => 'reality_saturation',
                'probability' => 0.6,
                'distance' => 75
            ]);
        }

        // 4. Kiểm tra sự hội tụ của các chân trời sự kiện (Historical Fulfillment)
        $this->checkConvergence($universe, $currentTick);
    }

    protected function hasActiveTrajectory(Universe $universe, string $type): bool
    {
        return $universe->hasMany(\App\Models\CausalTrajectory::class)
            ->where('convergence_type', $type)
            ->where('is_fulfilled', false)
            ->exists();
    }

    protected function checkConvergence(Universe $universe, int $currentTick): void
    {
        $overdue = $universe->hasMany(\App\Models\CausalTrajectory::class)
            ->where('is_fulfilled', false)
            ->where('target_tick', '<=', $currentTick)
            ->get();

        foreach ($overdue as $trajectory) {
            $trajectory->update(['is_fulfilled' => true]);
            Log::info("Causal Trajectory [{$trajectory->id}] reached convergence point at tick {$currentTick}");
        }
    }
}
