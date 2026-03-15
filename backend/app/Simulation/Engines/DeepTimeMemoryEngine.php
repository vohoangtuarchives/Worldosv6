<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 61: Deep Time Memory Engine (V8+) 🏺📜
 * 
 * Lưu trữ và chuyển hóa ký ức xuyên kỷ nguyên. 
 * Khi một Attractor kết thúc hoặc có biến động lớn, các "Vết sẹo" ngắn hạn 
 * sẽ được kết tinh thành "Di sản" (Legacy) dài hạn.
 */
class DeepTimeMemoryEngine
{
    public function runWithState(WorldState $state, int $tick): void
    {
        $scars = $state->getScars();
        $legacy = $state->getLegacyData();
        $activeAttractor = $state->getActiveAttractor();

        // Nếu thực tại đang ở trạng thái sụp đổ hoặc thăng hoa, 
        // hãy tích lũy di sản từ các vết sẹo mạnh nhất.
        if (in_array($activeAttractor, ['DARK_AGE', 'TRANSCENDENCE', 'APOTHEOSIS'])) {
            foreach ($scars as $key => $scar) {
                if ($scar['magnitude'] > 1.5) {
                    $legacyKey = "ANCIENT_" . $key;
                    
                    if (!isset($legacy[$legacyKey])) {
                        $legacy[$legacyKey] = [
                            'origin_type' => $scar['type'],
                            'potency' => $scar['magnitude'] * 0.5,
                            'epoch_tick' => $tick,
                            'is_fossilized' => true
                        ];
                        
                        Log::info("DeepTimeMemory: Scar $key has been fossilized into Legacy at tick $tick");
                    } else {
                        // Tăng cường di sản hiện có
                        $legacy[$legacyKey]['potency'] += $scar['magnitude'] * 0.1;
                    }
                }
            }
        }

        // Tác động ngược lại của Legacy lên thực tại
        $this->applyLegacyImpact($state, $legacy);

        $state->setLegacyData($legacy);
    }

    protected function applyLegacyImpact(WorldState $state, array $legacy): void
    {
        if (empty($legacy)) return;

        $fields = $state->getFields();
        $totalLegacyPotency = 0.0;

        foreach ($legacy as $item) {
            $totalLegacyPotency += $item['potency'];
            
            // Ví dụ: Di sản của chiến tranh cổ đại tạo ra sự thận trọng (Loyalty/Dogmatism)
            // Di sản của đổi mới cổ đại tạo ra Curiosity bẩm sinh
        }

        // Legacy tạo ra một "Trọng lực lịch sử" (Historical Gravity)
        // Nó làm tăng độ ổn định của Manifold
        $stabilityBonus = min(0.3, $totalLegacyPotency * 0.01);
        $state->setStabilityIndex($state->getStabilityIndex() + $stabilityBonus);

        $pressures = $state->getPressures();
        $pressures['historical_gravity'] = $totalLegacyPotency;
        $state->setPressures($pressures);
    }
}
