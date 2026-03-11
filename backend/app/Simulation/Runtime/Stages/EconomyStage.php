<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\GlobalEconomyEngine;

/**
 * Economy stage: global economy (Tier 10). Interval typically 10 ticks.
 */
final class EconomyStage implements SimulationStageInterface
{
    public function __construct(
        protected GlobalEconomyEngine $globalEconomyEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->globalEconomyEngine->evaluate($universe, $tick);
    }
}
