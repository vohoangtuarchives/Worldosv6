<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use function resource_path;
use function app;

/**
 * doc §10.2: Technological Evolution Engine via DSL.
 */
final class TechEvolutionEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function phase(): string { return 'meta'; }
    public function name(): string { return 'tech_evolution'; }
    public function priority(): int { return 20; }
    public function tickRate(): int { return 1; }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $this->ruleVm->evaluateAndApplyWithState($state, 'innovation/collective', $ctx->getTick());
        return EngineResult::empty();
    }
}



