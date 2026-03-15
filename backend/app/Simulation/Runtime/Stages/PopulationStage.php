<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\PopulationEngine;
use App\Simulation\Engines\AgricultureEngine;
use App\Simulation\Engines\DiseaseEngine;

/**
 * PopulationStage – handles biological life cycles.
 */
final class PopulationStage implements SimulationStageInterface
{
    public function __construct(
        protected PopulationEngine $populationEngine,
        protected AgricultureEngine $agricultureEngine,
        protected DiseaseEngine $diseaseEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        if ($savedSnapshot) {
            $state = $this->stateManager->get();
            if (!$state) return;

            // 1. Bio-layer computation (standardized state)
            $this->populationEngine->runWithState($state, $tick);
            $this->agricultureEngine->runWithState($state, $tick);
            $this->diseaseEngine->runWithState($state, $tick);
        }
    }
}
