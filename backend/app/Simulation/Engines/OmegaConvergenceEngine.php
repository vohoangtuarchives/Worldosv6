<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 64: Omega Point Convergence Engine (V8+) 🏁⚛️
 * 
 * Điểm cuối của quá trình tiến hóa: Tất cả các dòng thời gian hợp nhất.
 * Khi độ tương đồng giữa các vũ trụ lân cận đạt ngưỡng tuyệt đối, 
 * thực tại sẽ bước vào trạng thái "Omega" - Thống nhất hoàn toàn.
 */
class OmegaConvergenceEngine
{
    public function runWithState(WorldState $state, int $tick): void
    {
        $neighbors = $state->getNeighboringRealities();
        if (empty($neighbors)) return;

        $totalResonance = 0.0;
        foreach ($neighbors as $neighbor) {
            $totalResonance += (float)($neighbor['similarity_score'] ?? 0.0);
        }

        $avgResonance = $totalResonance / count($neighbors);
        
        // Ngưỡng hội tụ tuyệt đối
        if ($avgResonance > 0.98) {
            $state->set('meta.omega_convergence_active', true);
            $state->set('meta.omega_point_progress', ($avgResonance - 0.98) / 0.02);
            
            Log::info("OmegaConvergenceEngine: Omega Point approaching! Convergence progress: " . $state->get('meta.omega_point_progress'));
        }
    }
}
