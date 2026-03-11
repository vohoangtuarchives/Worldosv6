<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\PoliticsEngine;

/**
 * Politics stage (Tier 11). Interval typically 20 ticks.
 */
final class PoliticsStage implements SimulationStageInterface
{
    public function __construct(
        protected PoliticsEngine $politicsEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->politicsEngine->evaluate($universe, $tick);
    }
}
