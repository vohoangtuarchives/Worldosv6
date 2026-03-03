<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class ProcessActorSurvivalAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository
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
            
            // 1. Core Survival (Entropy/Stability)
            $actor->processSurvival($entropy, $worldStability);
            
            // 2. Trait Drift
            $actor->driftTraits();
            
            // 3. Life cycle (Aging/Risk)
            $actor->applyLifeCycle();

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
