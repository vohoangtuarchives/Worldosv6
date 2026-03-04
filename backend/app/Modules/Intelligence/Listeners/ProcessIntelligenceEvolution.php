<?php

namespace App\Modules\Intelligence\Listeners;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Modules\Intelligence\Actions\ProcessActorSurvivalAction;
use App\Modules\Intelligence\Actions\SpawnFromEventsAction;

class ProcessIntelligenceEvolution
{
    public function __construct(
        private ProcessActorSurvivalAction $survivalAction,
        private SpawnFromEventsAction $spawnAction,
        private \App\Modules\Intelligence\Services\ActorEvolutionService $evolutionService,
        private \App\Modules\Intelligence\Services\AgentAutonomyService $autonomyService
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $tick = (int) $event->snapshot->tick;
        
        // 1. Spawn logic
        $this->spawnAction->handle($event->universe, $tick);

        // 2. Evolution
        $this->evolutionService->evolve($event->universe, $tick);

        // 3. Autonomy Decisions
        $this->autonomyService->process($event->universe, $tick);

        // 4. Survival logic
        $this->survivalAction->handle($event->universe, $event->engineResponse);
    }
}
