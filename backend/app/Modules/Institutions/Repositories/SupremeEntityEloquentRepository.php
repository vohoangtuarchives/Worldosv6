<?php

namespace App\Modules\Institutions\Repositories;

use App\Models\SupremeEntity as SupremeEntityModel;
use App\Modules\Institutions\Contracts\SupremeEntityRepositoryInterface;
use App\Modules\Institutions\Entities\SupremeEntity;

class SupremeEntityEloquentRepository implements SupremeEntityRepositoryInterface
{
    public function findById(int $id): ?SupremeEntity
    {
        $model = SupremeEntityModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByUniverse(int $universeId): array
    {
        return SupremeEntityModel::where('universe_id', $universeId)
            ->get()
            ->map(fn($model) => $this->mapToEntity($model))
            ->toArray();
    }

    public function save(SupremeEntity $entity): void
    {
        $data = [
            'universe_id' => $entity->universeId,
            'name' => $entity->name,
            'entity_type' => $entity->entityType,
            'domain' => $entity->domain,
            'description' => $entity->description,
            'power_level' => $entity->powerLevel,
            'alignment' => $entity->alignment,
            'karma' => $entity->karma,
            'karma_metadata' => $entity->karmaMetadata,
            'status' => $entity->status,
            'ascended_at_tick' => $entity->ascendedAtTick,
            'fallen_at_tick' => $entity->fallenAtTick,
        ];

        if ($entity->id) {
            SupremeEntityModel::where('id', $entity->id)->update($data);
        } else {
            SupremeEntityModel::create($data);
        }
    }

    private function mapToEntity(SupremeEntityModel $model): SupremeEntity
    {
        return new SupremeEntity(
            id: $model->id,
            universeId: $model->universe_id,
            name: $model->name,
            entityType: $model->entity_type,
            domain: $model->domain,
            description: $model->description,
            powerLevel: (float) $model->power_level,
            alignment: $model->alignment ?? [],
            karma: (float) $model->karma,
            karmaMetadata: $model->karma_metadata ?? [],
            status: $model->status,
            ascendedAtTick: $model->ascended_at_tick,
            fallenAtTick: $model->fallen_at_tick
        );
    }
}
