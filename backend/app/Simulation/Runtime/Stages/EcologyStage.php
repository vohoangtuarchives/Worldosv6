<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Social\EcologicalCollapseEngine;
use App\Simulation\Engines\Physics\ClimateEngine;
use App\Simulation\Engines\Social\EcologicalPhaseTransitionEngine;
use App\Simulation\Engines\Physics\GeologicalEngine;
use App\Simulation\Domain\TickContext;

/**
 * Ecology stage: collapse, climate, phase transition, geology.
 */
final class EcologyStage implements SimulationStageInterface
{
    public function __construct(
        protected EcologicalCollapseEngine $ecologicalCollapseEngine,
        protected ClimateEngine $planetaryClimateEngine,
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

        $ctx = new TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->multiverse_id ?? 0));

        // 1. Collapse & Crisis
        $this->ecologicalCollapseEngine->handle($state, $ctx);

        // 2. Environment (Planetary Climate)
        $this->planetaryClimateEngine->handle($state, $ctx);

        // 3. Phase Transition (Forest, Grassland, Desert)
        $this->ecologicalPhaseTransitionEngine->handle($state, $ctx);

        // 4. Geological (Very slow)
        $this->geologicalEngine->handle($state, $ctx);
    }
}
