<?php

namespace App\Modules\Simulation\Core\Engines\Meta;

use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Contracts\SimulationEngine;
use App\Modules\Simulation\Core\Domain\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function file_get_contents;
use function file_exists;

/**
 * Phase 57: Dynamic Metaphysical Axioms Engine (V8+) 🌌📜
 * 
 * Điều phối sự thay đổi của các hằng số vật lý dựa trên trạng thái văn minh (Attractor).
 */
class DynamicLawEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected RuleVmService $ruleVmService
    ) {}

    public function name(): string
    {
        return 'dynamic_law';
    }

    public function phase(): string
    {
        return 'meta';
    }

    public function priority(): int
    {
        return 17;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $lawShiftsDsl = resource_path('worldos_rules/simulation/law_shifts.dsl');
        
        if (file_exists($lawShiftsDsl)) {
            // Thực thi ma trận dịch chuyển luật vật lý cơ bản
            $this->ruleVmService->evaluateAndApplyWithState(
                $state, 
                file_get_contents($lawShiftsDsl), 
                $tick
            );
        }

        // Phase 60: Ontological Resonance (Reality Warping)
        $fields = $state->getFields();
        $resonance = (float)($fields['resonance'] ?? 0.0);

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

        return EngineResult::empty();
    }
}



