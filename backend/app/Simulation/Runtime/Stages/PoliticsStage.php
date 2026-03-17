<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Engines\Social\PoliticsEngine;
use App\Simulation\Engines\Social\LegitimacyEliteEngine;
use App\Simulation\Domain\TickContext;

/**
 * Politics stage (Tier 11). Interval typically 20 ticks. Doc §17: legitimacy_aggregate, elite_ratio.
 */
final class PoliticsStage implements SimulationStageInterface
{
    public function __construct(
        protected PoliticsEngine $politicsEngine,
        protected LegitimacyEliteEngine $legitimacyEliteEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $ctx = new TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->multiverse_id ?? 0));

        $this->politicsEngine->handle($state, $ctx);
        $this->legitimacyEliteEngine->handle($state, $ctx);
    }
}
