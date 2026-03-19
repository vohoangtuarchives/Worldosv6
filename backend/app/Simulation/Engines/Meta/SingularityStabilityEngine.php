<?php

namespace App\Simulation\Engines\Meta;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use Illuminate\Support\Facades\Log;

/**
 * Phase 72: Singularity Stability Engine 🛡️🌀
 * 
 * Ngăn chặn các nghịch lý nhân quả và vòng lặp vô tận (Paradox Containment).
 * Đảm bảo thực tại không bị sụp đổ khi logic tự sinh (Autopoietic) biến đổi quá mức.
 */
class SingularityStabilityEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        private readonly RuleVmService $vmService
    ) {}

    public function name(): string
    {
        return 'singularity_stability';
    }

    public function phase(): string
    {
        return 'meta';
    }

    public function priority(): int
    {
        return 72;
    }

    public function tickRate(): int
    {
        return 1;
    }

    /**
     * Chạy giám sát và ổn định hóa thực tại.
     */
    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $stability = (float)$state->get('stability_index', 1.0);
        $entropy = (float)$state->get('fields.entropy', 0);
        $divergence = (float)$state->get('meta.causal_divergence', 0);

        // 1. Phân tích Paradox (Nghịch lý)
        // Nếu entropy tăng vọt quá nhanh hoặc stability giảm mạnh
        if ($entropy > 0.9 && $stability < 0.2) {
            $this->containParadox($state);
        }

        // 2. Phân tích Divergence (Phân kỳ)
        // Nếu độ phân kỳ nhân quả quá cao, thực hiện Dampening
        if ($divergence > 0.8) {
            $this->applyCausalDampening($state);
        }

        // 3. Thực thi Apex DSL Rules cho sự ổn định
        $this->vmService->evaluateAndApplyWithState(
            $state,
            'simulation/apex.dsl',
            $tick,
            ['mode' => 'STABILITY_CHECK']
        );

        return new EngineResult([], [], []);
    }

    /**
     * Chống lại nghịch lý bằng cách reset các biến động cực đoan.
     */
    private function containParadox(WorldState $state): void
    {
        Log::warning("SingularityStabilityEngine: Paradox detected! Initiating containment protocols.");
        
        $state->set('stability_index', 0.5);
        $state->updateField('entropy', -0.3, 'Paradox Containment');
        
        // Ghi lại Scar lịch sử
        $scars = $state->get('scars', []);
        $scars[] = [
            'type' => 'PARADOX_CONTAINMENT',
            'magnitude' => 0.8,
            'description' => 'Một nghịch lý nhân quả đã bị cưỡng chế dập tắt bởi hệ thống ổn định Singularity.',
            'timestamp' => now()->toIso8601String()
        ];
        $state->set('scars', $scars);
    }

    /**
     * Giảm tốc độ thay đổi của các trường để tránh sụp đổ logic.
     */
    private function applyCausalDampening(WorldState $state): void
    {
        Log::info("SingularityStabilityEngine: High causal divergence. Applying dampening.");
        
        $state->set('meta.rule_mutation_rate', (float)$state->get('meta.rule_mutation_rate', 0) * 0.5);
        $state->set('meta.causal_divergence', (float)$state->get('meta.causal_divergence', 0) * 0.7);
    }
}



