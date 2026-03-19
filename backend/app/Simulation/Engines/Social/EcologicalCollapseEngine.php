<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use Illuminate\Support\Facades\Log;

/**
 * Ecological Collapse Engine via DSL.
 */
final class EcologicalCollapseEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected ?RuleVmService $ruleVm = null
    ) {
        $this->ruleVm = $ruleVm ?? \app(RuleVmService::class);
    }

    public function phase(): string
    {
        return 'ecology';
    }

    public function name(): string
    {
        return 'ecological_collapse';
    }

    public function priority(): int
    {
        return 10;
    }

    public function tickRate(): int
    {
        return (int) \config('worldos.intelligence.ecological_collapse_tick_interval', 50);
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        // Phase 5: Pure State Ecology Alignment
        $outputs = $this->ruleVm->evaluateWithResults(
            $state, 
            'biology/biosphere.dsl', 
            $ctx->getTick(),
            ['mode' => 'ECOLOGICAL_COLLAPSE_CHECK']
        );

        return $this->ruleVm->mapOutputsToResults(
            $outputs,
            $ctx->getUniverseId(),
            $ctx->getTick(),
            $state
        );
    }
}



