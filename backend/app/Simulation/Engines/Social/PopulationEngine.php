<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Models\UniverseSnapshot;
use function resource_path;
use function file_get_contents;
use function app;
use function max;

/**
 * doc §7.1: Population Engine via DSL.
 */
final class PopulationEngine implements SimulationEngine
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
        return 'population';
    }

    public function priority(): int
    {
        return 12;
    }

    public function tickRate(): int
    {
        return 1;
    }


    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $dslFile = \resource_path('worldos_rules/biology/biosphere.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';
        
        $vec = $state->getStateVector();
        
        $rawState = [
            'population' => (float) ($vec['population'] ?? 1000),
            'entropy' => (float) ($state->getEntropy() ?? 0.5),
            'is_collapse_active' => (bool) ($vec['ecology']['is_collapse_active'] ?? false),
            'instability_score' => (float) ($vec['ecology']['instability_score'] ?? 0.0),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        $effects = [];
        if ($result['ok'] ?? false) {
            $fs = $result['state'] ?? [];
            $fertility = (float) ($fs['fertility'] ?? 0.05);
            $mortality = (float) ($fs['mortality'] ?? 0.02);
            
            $currentPop = (float) ($vec['population'] ?? 1000);
            $growth = $currentPop * ($fertility - $mortality);
            $newPop = max(0, $currentPop + $growth);
            
            // Effect to update population in state vector
            $effects[] = new WorldRulesUpdateEffect([
                'population' => $newPop,
                'last_growth' => $growth,
                'fertility_rate' => $fertility,
                'mortality_rate' => $mortality
            ]);
        }

        return new EngineResult([], $effects, []);
    }
}



