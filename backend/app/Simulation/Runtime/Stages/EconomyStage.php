<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Social\GlobalEconomyEngine;
use App\Simulation\Engines\Social\InequalityEngine;
use App\Simulation\Engines\Social\MarketEngine;
use App\Simulation\Engines\Social\TradeEngine;
use App\Simulation\Domain\TickContext;

/**
 * Economy stage: global economy (Tier 10) + market prices + inequality (Doc §7). Interval typically 20 ticks.
 */
final class EconomyStage implements SimulationStageInterface
{
    public function __construct(
        protected GlobalEconomyEngine $globalEconomyEngine,
        protected MarketEngine $marketEngine,
        protected InequalityEngine $inequalityEngine,
        protected TradeEngine $tradeEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager,
        protected \App\Modules\Simulation\Services\RuleEngine\RuleVmService $ruleVm
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $ctx = new TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->multiverse_id ?? 0));

        $this->globalEconomyEngine->handle($state, $ctx);
        $this->tradeEngine->handle($state, $ctx);
        $this->marketEngine->handle($state, $ctx);
        $this->inequalityEngine->handle($state, $ctx);

        // 4. Macro-Economic DSL (Phase 45 Integration)
        $dslFile = resource_path('worldos_rules/simulation/market.dsl');
        if (file_exists($dslFile)) {
            $dsl = file_get_contents($dslFile);
            $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);
        }
    }
}

