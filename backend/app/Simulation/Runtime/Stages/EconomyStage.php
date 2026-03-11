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
        protected InequalityEngine $inequalityEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->globalEconomyEngine->evaluate($universe, $tick);
        $universe->refresh();
        $this->marketEngine->evaluate($universe, $tick);
        $universe->refresh();
        $this->inequalityEngine->evaluate($universe, $tick);
    }
}
