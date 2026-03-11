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
        protected GeologicalEngine $geologicalEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->ecologicalCollapseEngine->evaluate($universe, $tick);
        $this->planetaryClimateEngine->evaluate($universe, $tick);
        $this->ecologicalPhaseTransitionEngine->evaluate($universe, $tick);
        $this->geologicalEngine->evaluate($universe, $tick);
    }
}
