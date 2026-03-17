<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Social\PopulationEngine;
use App\Simulation\Engines\Social\AgricultureEngine;
use App\Simulation\Engines\Social\DiseaseEngine;
use App\Simulation\Domain\TickContext;

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
        $state = $this->stateManager->get();
        if (!$state) return;

        $ctx = new TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->multiverse_id ?? 0));

        // 1. Bio-layer computation (standardized state)
        $this->populationEngine->handle($state, $ctx);
        $this->agricultureEngine->handle($state, $ctx);
        $this->diseaseEngine->handle($state, $ctx);
    }
}
