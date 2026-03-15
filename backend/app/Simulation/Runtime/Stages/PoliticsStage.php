<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\LegitimacyEliteService;
use App\Services\Simulation\PoliticsEngine;

/**
 * Politics stage (Tier 11). Interval typically 20 ticks. Doc §17: legitimacy_aggregate, elite_ratio.
 */
final class PoliticsStage implements SimulationStageInterface
{
    public function __construct(
        protected PoliticsEngine $politicsEngine,
        protected LegitimacyEliteService $legitimacyEliteService,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $this->politicsEngine->runWithState($state, $tick);
        $this->legitimacyEliteService->runWithState($state, $tick);
    }
}
