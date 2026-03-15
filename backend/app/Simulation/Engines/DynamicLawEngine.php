<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;

/**
 * Phase 57: Dynamic Metaphysical Axioms Engine (V8+) 🌌📜
 * 
 * Điều phối sự thay đổi của các hằng số vật lý dựa trên trạng thái văn minh (Attractor).
 */
class DynamicLawEngine
{
    public function __construct(
        protected RuleVmService $ruleVmService
    ) {}

    public function runWithState(WorldState $state, int $tick): void
    {
        $lawShiftsDsl = resource_path('worldos_rules/simulation/law_shifts.dsl');
        
        if (!file_exists($lawShiftsDsl)) {
            return;
        }

        // Thực thi ma trận dịch chuyển luật vật lý cơ bản
        $this->ruleVmService->evaluateAndApplyWithState(
            $state, 
            file_get_contents($lawShiftsDsl), 
            $tick
        );

        // Phase 60: Ontological Resonance (Reality Warping)
        $fields = $state->getFields();
        $resonance = (float)($fields['resonance'] ?? 0.0);
        $meaning = (float)($fields['meaning'] ?? 0.0);

        if ($resonance > 0.8) {
            $warpFactor = ($resonance - 0.8) * 5.0; // 0 to 1.0
            $ontologicalDsl = resource_path('worldos_rules/simulation/ontological.dsl');
            
            if (file_exists($ontologicalDsl)) {
                $state->set('meta.reality_warping', $warpFactor);
                $this->ruleVmService->evaluateAndApplyWithState(
                    $state,
                    file_get_contents($ontologicalDsl),
                    $tick
                );
                Log::info("DynamicLawEngine: Ontological Resonance detected! Warp Factor: $warpFactor");
            }
        }

        Log::debug("DynamicLawEngine: Metaphysical law shifts applied for attractor: " . $state->getActiveAttractor());
    }
}
