<?php

namespace App\Actions\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\BranchEvent;
use App\Models\Universe;
use App\Services\Saga\SagaService;

class ForkUniverseAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected SagaService $sagaService
    ) {}

    /**
     * Execute universe forking logic 
     */
    public function execute(Universe $universe, int $fromTick, array $decisionData): void
    {
        $exists = BranchEvent::where('universe_id', $universe->id)
            ->where('from_tick', $fromTick)
            ->where('event_type', 'fork')
            ->exists();
            
        if (! $exists) {
            $payload = [
                'reason' => $decisionData['meta']['reason'] ?? 'high_entropy',
                'mutation' => $decisionData['meta']['mutation_suggestion'] ?? null,
                'score' => $decisionData['meta']['ip_score'] ?? 0,
            ];
            
            BranchEvent::create([
                'universe_id' => $universe->id,
                'from_tick' => $fromTick,
                'event_type' => 'fork',
                'payload' => $payload,
            ]);
            
            // Calling SagaService for now, eventually this will also be refactored to an Action (SpawnUniverseAction)
            $this->sagaService->spawnUniverse(
                $universe->world,
                $universe->id,
                $universe->saga_id,
                $payload
            );
            
            // Release pressure
            $vec = $universe->state_vector ?? [];
            $vec['entropy'] = 0.5; 
            
            $this->universeRepository->update($universe->id, ['state_vector' => $vec]);
        }
    }
}
