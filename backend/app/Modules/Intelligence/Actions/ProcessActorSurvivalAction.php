<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class ProcessActorSurvivalAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository,
        private \App\Modules\Intelligence\Services\ActorTransitionSystem $transitionSystem
    ) {}

    public function handle(Universe $universe, array $simulationResponse): void
    {
        $actors = $this->actorRepository->findByUniverse($universe->id);
        $worldStability = (float) ($simulationResponse['snapshot']['stability_index'] ?? 0.5);
        $entropy = (float) ($simulationResponse['snapshot']['entropy'] ?? 0.5);

        $deathCount = 0;
        foreach ($actors as $actor) {
            if (!$actor->isAlive) continue;

            $oldState = $actor->isAlive;
            
            // Generate seeded RNG for this survival check
            $rng = new \App\Modules\Intelligence\Domain\Rng\SimulationRng(
                $universe->seed ?? 0,
                $universe->current_tick ?? 0,
                $actor->id
            );
            
            // Convert to State -> Process -> Convert back to Entity
            $state = $actor->toState();
            $state = $this->transitionSystem->processSurvival($state, $entropy, $rng);
            $actor->fromState($state);

            if ($oldState && !$actor->isAlive) {
                $deathCount++;
                Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) has perished in Universe {$universe->id} at tick {$universe->current_tick}.");
            }

            $this->actorRepository->save($actor);
        }

        if ($deathCount > 0) {
            Log::info("Intelligence: Processed survival for Universe {$universe->id}. Deaths: $deathCount.");
        }
    }
}
