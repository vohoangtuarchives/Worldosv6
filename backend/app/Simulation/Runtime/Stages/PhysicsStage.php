<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Physics\CosmicPressureEngine;

/**
 * PhysicsStage – high-level universal physics and pressures.
 */
final class PhysicsStage implements SimulationStageInterface
{
    public function __construct(
        protected \App\Simulation\Engines\Physics\CosmicPressureEngine $cosmicPressureEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(\App\Models\Universe $universe, int $tick, ?\App\Models\UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) {
            return;
        }

        $ctx = new \App\Simulation\Domain\TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->seed ?? 0));
        $this->cosmicPressureEngine->handle($state, $ctx);
    }
}
