<?php

namespace App\Simulation\Engines\Meta;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function file_get_contents;
use function file_exists;

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
        $path = resource_path('worldos_rules/simulation/meta_attractors.dsl');
        
        if (!file_exists($path)) {
            Log::warning("MetaAttractorEngine: meta_attractors.dsl not found at {$path}");
            return EngineResult::empty();
        }

        $dsl = file_get_contents($path);

        // Chạy DSL để thực hiện Pull và Transitions
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        // Hậu xử lý (Optional): Nếu có logic phức tạp về Stability hoặc Noise có thể thêm ở đây
        // Ví dụ: Add stochastic noise to the current attractor

        return EngineResult::empty();
    }
}
