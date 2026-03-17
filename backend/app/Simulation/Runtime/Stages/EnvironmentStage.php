<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Physics\ClimateEngine;
use App\Simulation\Engines\Physics\GeologicalEngine;

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

        $ctx = new \App\Simulation\Domain\TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->seed ?? 0));

        // 1. Climate logic (Modern WorldState approach)
        $this->climateEngine->handle($state, $ctx);

        // 2. Geological logic (Phase 40: Unified)
        $this->geologicalEngine->runWithState($state, $tick);
    }
}
