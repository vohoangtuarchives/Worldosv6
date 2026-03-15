<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function app;
use function config;

/**
 * Evolves world_rules (Tier 2 mutable rules) via DSL logic.
 */
class LawEvolutionEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected ?RuleVmService $ruleVm = null
    ) {
        $this->ruleVm = $ruleVm ?? app(RuleVmService::class);
    }

    public function phase(): string
    {
        return 'politics';
    }

    private const MUTABLE_KEYS = ['entropy_tendency', 'order_tendency', 'innovation_tendency'];

    public function name(): string
    {
        return 'law_evolution';
    }

    public function priority(): int
    {
        return 6;
    }

    public function tickRate(): int
    {
        return max(1, (int) (\config('worldos.time_scale_factors.law_evolution') ?? 20));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        return new EngineResult([], [], []); // Deprecated in favor of runWithState
    }

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $tick): void
    {
        $dslFile = \resource_path('worldos_rules/innovation/leadership.dsl');
        if (!file_exists($dslFile)) return;

        $dsl = file_get_contents($dslFile);
        
        // Evaluate leadership/rule mutations
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        Log::info("LawEvolutionEngine: World rules evolved via DSL for Universe {$state->get('universe_id')} at tick {$tick}");
    }
}
