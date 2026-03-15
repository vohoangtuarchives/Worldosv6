<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Contracts\CausalityGraphServiceInterface;
use Illuminate\Support\Facades\Log;

/**
 * Phase 55: Causal History & Reasoning Engine (V8 Core) 🕰️🔗
 * 
 * Engine này phân tích các biến động của State (Deltas) và các Áp lực (Pressures) 
 * để thiết lập các liên kết nhân quả giữa các sự kiện trong Causal Graph.
 */
class CausalHistoryEngine
{
    public function __construct(
        protected CausalityGraphServiceInterface $causalityGraph
    ) {}

    public function runWithState(WorldState $state, int $tick): void
    {
        $activeAttractor = $state->getActiveAttractor();
        $previousAttractor = $state->getPreviousAttractor();
        $pressures = $state->getPressures();

        // 1. Phân tích sự chuyển dịch Attractor
        if ($activeAttractor !== $previousAttractor && $previousAttractor !== 'none') {
            $this->recordAttractorCausality($state, $previousAttractor, $activeAttractor, $tick);
            // Sau khi ghi nhận, reset previous để tránh ghi đè
            $state->setPreviousAttractor($activeAttractor);
        }

        // 2. Phân tích các áp lực đột biến (Pressure Spikes)
        foreach ($pressures as $name => $value) {
            if ($value > 0.8) {
                // Ghi nhận áp lực cao như một "nguyên nhân tiềm năng" cho các sự kiện tiếp theo
                Log::debug("CausalHistoryEngine: Detecting high pressure spike: {$name} at {$value}");
            }
        }
    }

    protected function recordAttractorCausality(WorldState $state, string $from, string $to, int $tick): void
    {
        $universeId = (int)$state->get('universe_id');
        $id = "TRANSITION_" . $tick . "_" . $from . "_TO_" . $to;
        
        // Ghi lại sự kiện chuyển dịch vào Graph nhân quả
        $this->causalityGraph->recordEvent(
            $universeId,
            $id,
            'ATTRACTOR_TRANSITION',
            $tick
        );

        Log::info("CausalHistoryEngine: Recorded transition causality from {$from} to {$to}");
    }
}
