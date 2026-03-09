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
        $metrics = $data['metrics'] ?? ['influence' => 0.5];
        if (array_key_exists('spawned_at_tick', $data)) {
            $metrics['spawned_at_tick'] = $data['spawned_at_tick'];
        }
        if (!isset($metrics['physic'])) {
            $metrics['physic'] = ActorEntity::defaultPhysicVector();
        }

        $actor = new ActorEntity(
            id: null,
            universeId: $data['universe_id'],
            name: $data['name'],
            archetype: $data['archetype'],
            traits: $data['traits'] ?? $this->generateDefaultTraits(),
            metrics: $metrics,
            isAlive: true,
            generation: $data['generation'] ?? 1,
            biography: $data['biography'] ?? null
        );

        $this->actorRepository->save($actor);

        return $actor;
    }

    private function generateDefaultTraits(): array
    {
        // 18 dimensions: 17 gốc + Longevity (index 17)
        return array_fill(0, 18, 0.5);
    }
}
