<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\EcologicalCollapseEngine;
use App\Services\Simulation\PlanetaryClimateEngine;
use App\Services\Simulation\EcologicalPhaseTransitionEngine;
use App\Services\Simulation\GeologicalEngine;

/**
 * Ecology stage: collapse, climate, phase transition, geology.
 */
final class EcologyStage implements SimulationStageInterface
{
    public function __construct(
        protected EcologicalCollapseEngine $ecologicalCollapseEngine,
        protected PlanetaryClimateEngine $planetaryClimateEngine,
        protected EcologicalPhaseTransitionEngine $ecologicalPhaseTransitionEngine,
        protected GeologicalEngine $geologicalEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) {
            return;
        }

        // 1. Collapse & Crisis
        $this->ecologicalCollapseEngine->runWithState($state, $tick);

        // 2. Environment (Planetary Climate)
        $this->planetaryClimateEngine->runWithState($state, $tick);

        // 3. Phase Transition (Forest, Grassland, Desert)
        $this->ecologicalPhaseTransitionEngine->runWithState($state, $tick);
    }
}
