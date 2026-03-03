<?php

namespace App\Modules\Intelligence\Repositories;

use App\Models\Actor as ActorModel;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;

class ActorEloquentRepository implements ActorRepositoryInterface
{
    public function findById(int $id): ?ActorEntity
    {
        $model = ActorModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByUniverse(int $universeId): array
    {
        return ActorModel::where('universe_id', $universeId)
            ->get()
            ->map(fn($model) => $this->mapToEntity($model))
            ->toArray();
    }

    public function save(ActorEntity $entity): void
    {
        $data = [
            'universe_id' => $entity->universeId,
            'name' => $entity->name,
            'archetype' => $entity->archetype,
            'traits' => $entity->traits,
            'metrics' => $entity->metrics,
            'is_alive' => $entity->isAlive,
            'generation' => $entity->generation,
            'biography' => $entity->biography,
        ];

        if ($entity->id) {
            ActorModel::where('id', $entity->id)->update($data);
        } else {
            ActorModel::create($data);
        }
    }

    public function delete(int $id): void
    {
        ActorModel::destroy($id);
    }

    public function getActiveCount(int $universeId): int
    {
        return ActorModel::where('universe_id', $universeId)
            ->where('is_alive', true)
            ->count();
    }

    private function mapToEntity(ActorModel $model): ActorEntity
    {
        return new ActorEntity(
            id: $model->id,
            universeId: $model->universe_id,
            name: $model->name,
            archetype: $model->archetype,
            traits: $model->traits ?? [],
            metrics: $model->metrics ?? [],
            isAlive: (bool) $model->is_alive,
            generation: (int) $model->generation,
            biography: $model->biography
        );
    }
}
