<?php

namespace App\Modules\Simulation\Repositories;

use App\Models\Universe as UniverseModel;
use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Modules\Simulation\Entities\UniverseEntity;

class UniverseEloquentRepository implements UniverseRepositoryInterface
{
    public function findById(int $id): ?UniverseEntity
    {
        $model = UniverseModel::find($id);
        
        if (!$model) {
            return null;
        }

        return new UniverseEntity(
            id: $model->id,
            worldId: $model->world_id,
            name: $model->name,
            entropy: (float) (($model->state_vector ?? [])['entropy'] ?? 0.0),
            stabilityIndex: (float) (($model->state_vector ?? [])['stability_index'] ?? 0.0),
            observationLoad: (float) ($model->observation_load ?? 0.0),
            stateVector: $model->state_vector ?? [],
            status: $model->status
        );
    }

    public function save(UniverseEntity $entity): void
    {
        $model = UniverseModel::findOrFail($entity->id);
        
        $stateVector = $entity->stateVector;
        $stateVector['entropy'] = $entity->entropy;
        $stateVector['stability_index'] = $entity->stabilityIndex;

        $model->update([
            'observation_load' => $entity->observationLoad,
            'state_vector' => $stateVector,
            'status' => $entity->status
        ]);
    }
}
