<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\ClimateEngine;
use App\Services\Simulation\GeologicalEngine;

/**
 * EnvironmentStage – handles climate and geological changes.
 */
final class EnvironmentStage implements SimulationStageInterface
{
    public function __construct(
        protected ClimateEngine $climateEngine,
        protected GeologicalEngine $geologicalEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) {
            return;
        }

        // 1. Climate logic (Modern WorldState approach)
        $this->climateEngine->runWithState($state, $tick);

        // 2. Geological logic (Phase 40: Unified)
        $this->geologicalEngine->runWithState($state, $tick);
    }
}
