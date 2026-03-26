<?php

namespace App\Modules\Simulation\Core\Engines\Meta;

use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Contracts\SimulationEngine;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Runtime\RuleVM\RuleVmService;
use Illuminate\Support\Facades\Log;

/**
 * Phase 53: Meta-Attractor Graph Engine (V8 Core) 🌌🕸️
 * 
 * Quản lý sự di chuyển của văn minh giữa các trạng thái vĩ mô (Attractors) 
 * như một đồ thị nhân quả.
 */
class MetaAttractorEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function name(): string
    {
        return 'meta_attractor';
    }

    public function phase(): string
    {
        return 'meta';
    }

    public function priority(): int
    {
        return 18;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $path = 'simulation/meta_attractors';
        
        $dsl = $this->ruleVm->loadDsl($path);

        if (empty($dsl)) {
            Log::warning("MetaAttractorEngine: meta_attractors.dsl not found or empty");
            return EngineResult::empty();
        }

        // Chạy DSL để thực hiện Pull và Transitions
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        // Hậu xử lý (Optional): Nếu có logic phức tạp về Stability hoặc Noise có thể thêm ở đây
        // Ví dụ: Add stochastic noise to the current attractor

        return EngineResult::empty();
    }
}


