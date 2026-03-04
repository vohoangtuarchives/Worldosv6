<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\BranchEvent;
use Illuminate\Support\Facades\Log;

class OmegaEngine
{
    /**
     * Kiểm tra và kích hoạt các trạng thái kết thúc (Omega States) (§49.3).
     */
    public function checkOmegaStatus(Universe $universe, array $metrics): void
    {
        $entropy = $metrics['entropy'] ?? 0;
        $sci = $metrics['sci'] ?? 0;
        $tech = $metrics['knowledge_frontier_avg'] ?? 0;
        
        // 1. Heat Death (Entropy cực đại, Trật tự biến mất)
        if ($entropy > 0.98) {
            $this->triggerHeatDeath($universe);
        }

        // 2. Apotheosis (Đỉnh cao văn minh, SCI và Tech tối đa)
        if ($sci > 0.92 && $tech > 0.9) {
            $this->triggerApotheosis($universe);
        }
    }

    protected function triggerHeatDeath(Universe $universe): void
    {
        if ($universe->status === 'halted') return;

        Log::critical("OMEGA STATE: Heat Death detected in Universe [{$universe->id}]. Simulation halted.");
        
        $universe->update(['status' => 'halted']);
        
        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'event_type' => 'heat_death',
            'description' => "Vũ trụ đã chạm tới Entropy tuyệt đối. Mọi cấu trúc tan rã.",
        ]);
    }

    protected function triggerApotheosis(Universe $universe): void
    {
        Log::info("OMEGA STATE: Apotheosis achieved in Universe [{$universe->id}].");

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'event_type' => 'apotheosis',
            'description' => "Thăng hoa toàn thể (Collective Ascension). Nền văn minh đã vượt qua giới hạn vật chất.",
            'payload' => ['is_eternal' => true]
        ]);
    }
}
