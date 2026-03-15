<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Modules\Intelligence\Services\CultureEngine;

/**
 * Culture stage: meme transmission, drift, culture_group (Tier 7). Feeds behavior.
 */
final class CultureStage implements SimulationStageInterface
{
    public function __construct(
        protected CultureEngine $cultureEngine,
        protected \App\Simulation\Engines\MythogenesisEngine $mythogenesisEngine,
        protected \App\Simulation\Engines\MeaningEngine $meaningEngine,
        protected \App\Simulation\Engines\KnowledgeEvolutionEngine $knowledgeEvolutionEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $this->cultureEngine->runWithState($state, $tick);
        $this->mythogenesisEngine->run($state, $tick);
        $this->meaningEngine->run($state, $tick);
        $this->knowledgeEvolutionEngine->run($state, $tick);
    }
}
