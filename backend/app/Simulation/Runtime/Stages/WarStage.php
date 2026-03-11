<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\WarEngine;

/**
 * War stage (Tier 12). Interval typically 50 ticks.
 */
final class WarStage implements SimulationStageInterface
{
    public function __construct(
        protected WarEngine $warEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->warEngine->evaluate($universe, $tick);
    }
}
