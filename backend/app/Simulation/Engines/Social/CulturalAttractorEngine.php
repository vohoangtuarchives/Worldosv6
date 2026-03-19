<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 71: Cultural Attractor Engine 🧘‍♂️🏛️
 * 
 * Mô phỏng khuynh hướng văn hóa tự ổn định (Attractors).
 * Giải thích tại sao văn minh thường quay lại những khuôn mẫu cũ.
 */
class CulturalAttractorEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string
    {
        return 'cultural_attractor';
    }

    public function phase(): string
    {
        return 'social';
    }

    public function priority(): int
    {
        return 12;
    }

    public function tickRate(): int
    {
        return 1;
    }

    /**
     * Áp dụng lực hút từ các Attractor văn hóa thông qua Rust FFI (sử dụng toán học Drift)
     */
    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        // 1. Lấy trạng thái mặc định 8 chiều nếu chưa có
        $currentCulture = $state->get('meta.culture_vector', [
            'survival' => 0.5, 'power' => 0.5, 'order' => 0.5, 'reason' => 0.5,
            'strategy' => 0.5, 'system' => 0.5, 'holistic' => 0.5, 'integral' => 0.5
        ]);

        $activeAttractor = $this->determineActiveAttractor($state);
        $pullStrength = 0.02; // Base drift speed

        // 2. Sinh ruleset FFI tự động để thực hiện nội suy (Drift action)
        $dslLines = [];
        foreach ($activeAttractor as $dim => $targetValue) {
            // Mẫu: drift meta.culture_vector.survival target 0.9 speed 0.02
            $dslLines[] = "drift meta.culture_vector.{$dim} target {$targetValue} speed {$pullStrength}";
        }
        $dslScript = implode("\n", $dslLines);

        // 3. Chạy biểu thức qua RuleVmService (Rust FFI engine)
        $vm = app(\App\Modules\Simulation\Services\RuleEngine\RuleVmService::class);
        $outputs = $vm->evaluateWithResults($state, $dslScript, $ctx->getTick());
        
        // 4. Map kết quả parse về WorldStateUpdateEffect chuẩn
        $universeId = $ctx->getUniverseId();
        return $vm->mapOutputsToResults($outputs, $universeId, $ctx->getTick(), $state);
    }

    private function determineActiveAttractor(WorldState $state): array
    {
        $entropy = (float) $state->get('entropy', 0.5);
        $belief = (float) $state->get('fields.belief', 0.0);
        $knowledge = (float) $state->get('fields.knowledge', 0.0);
        $wealth = (float) $state->get('fields.wealth', 0.0);

        // Khủng hoảng sinh tồn (High entropy) -> Kéo về Survival & Power (Vùng trũng)
        if ($entropy > 0.8) {
            return [
                'survival' => 0.9, 'power' => 0.8, 'order' => 0.4, 'reason' => 0.2, 
                'strategy' => 0.2, 'system' => 0.1, 'holistic' => 0.1, 'integral' => 0.0
            ];
        }

        // Kỷ nguyên Thần Quyền (High belief) -> Order & Power
        if ($belief > 0.7 && $knowledge < 0.4) {
             return [
                'survival' => 0.3, 'power' => 0.6, 'order' => 0.9, 'reason' => 0.2, 
                'strategy' => 0.2, 'system' => 0.3, 'holistic' => 0.1, 'integral' => 0.1
            ];
        }

        // Kỷ nguyên Khai Sáng / Tư Bản (High knowledge & wealth) -> Reason, Strategy, System
        if ($knowledge > 0.6 && $wealth > 0.5) {
             return [
                'survival' => 0.1, 'power' => 0.4, 'order' => 0.5, 'reason' => 0.9, 
                'strategy' => 0.8, 'system' => 0.7, 'holistic' => 0.3, 'integral' => 0.2
            ];
        }

        // Kỷ Nguyên Phục Hưng / Hỗn Hợp Sinh Thái (Holistic)
        if ($knowledge > 0.8 && $belief > 0.5) {
            return [
                'survival' => 0.1, 'power' => 0.2, 'order' => 0.4, 'reason' => 0.7, 
                'strategy' => 0.6, 'system' => 0.8, 'holistic' => 0.9, 'integral' => 0.8
            ];
        }

        // Mặc định: "Balanced Stability" (Order / Reason)
        return [
            'survival' => 0.5, 'power' => 0.5, 'order' => 0.5, 'reason' => 0.5, 
            'strategy' => 0.5, 'system' => 0.5, 'holistic' => 0.5, 'integral' => 0.5
        ];
    }
}

