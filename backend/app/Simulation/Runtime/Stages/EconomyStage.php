<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\GlobalEconomyEngine;
use App\Services\Simulation\InequalityEngine;
use App\Services\Simulation\MarketEngine;

/**
 * Economy stage: global economy (Tier 10) + market prices + inequality (Doc §7). Interval typically 20 ticks.
 */
final class EconomyStage implements SimulationStageInterface
{
    public function __construct(
        protected GlobalEconomyEngine $globalEconomyEngine,
        protected MarketEngine $marketEngine,
        protected InequalityEngine $inequalityEngine,
        protected \App\Simulation\Engines\TradeEngine $tradeEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager,
        protected \App\Services\Simulation\RuleVmService $ruleVm
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $this->globalEconomyEngine->runWithState($state, $tick);
        $this->tradeEngine->runWithState($state, $tick);
        $this->marketEngine->runWithState($state, $tick);
        $this->inequalityEngine->runWithState($state, $tick);

        // 4. Macro-Economic DSL (Phase 45 Integration)
        $dslFile = resource_path('worldos_rules/simulation/market.dsl');
        if (file_exists($dslFile)) {
            $dsl = file_get_contents($dslFile);
            $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);
        }
    }
}
