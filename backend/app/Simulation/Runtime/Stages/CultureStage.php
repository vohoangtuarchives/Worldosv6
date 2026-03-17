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
        protected \App\Simulation\Engines\Meta\MythogenesisEngine $mythogenesisEngine,
        protected \App\Simulation\Engines\Meta\MeaningEngine $meaningEngine,
        protected \App\Simulation\Engines\Meta\KnowledgeEvolutionEngine $knowledgeEvolutionEngine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $state = $this->stateManager->get();
        if (!$state) return;

        $ctx = new \App\Simulation\Domain\TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->seed ?? 0));

        $this->cultureEngine->runWithState($state, $tick);
        $this->mythogenesisEngine->handle($state, $ctx);
        $this->meaningEngine->handle($state, $ctx);
        $this->knowledgeEvolutionEngine->handle($state, $ctx);
    }
}
