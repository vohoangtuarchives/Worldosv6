<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;

class SpawnActorAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository
    ) {}

    public function handle(array $data): ActorEntity
    {
        $actor = new ActorEntity(
            id: null,
            universeId: $data['universe_id'],
            name: $data['name'],
            archetype: $data['archetype'],
            traits: $data['traits'] ?? $this->generateDefaultTraits(),
            metrics: $data['metrics'] ?? ['influence' => 0.5],
            isAlive: true,
            generation: $data['generation'] ?? 1,
            biography: $data['biography'] ?? null
        );

        $this->actorRepository->save($actor);
        
        return $actor;
    }

    private function generateDefaultTraits(): array
    {
        // Default 17 dimensions as per HeroicActorService
        return array_fill(0, 17, 0.5);
    }
}
