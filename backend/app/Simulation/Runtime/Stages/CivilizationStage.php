<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\CivilizationSettlementEngine;

/**
 * Civilization stage: settlements, governance (Tier 9). Economy/Politics/War are separate stages.
 */
final class CivilizationStage implements SimulationStageInterface
{
    public function __construct(
        protected CivilizationSettlementEngine $civilizationSettlementEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) {
            return;
        }

        $this->civilizationSettlementEngine->runWithState($state, $tick);
    }
}
