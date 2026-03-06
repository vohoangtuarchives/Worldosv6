<?php

namespace App\Modules\Institutions\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Institutions\Contracts\InstitutionalRepositoryInterface;
use App\Modules\Institutions\Actions\SpawnInstitutionAction;
use App\Modules\Institutions\Actions\CollapseInstitutionAction;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Actions\SpawnActorAction;

class InstitutionEvolutionService
{
    public function __construct(
        private InstitutionalRepositoryInterface $institutionalRepository,
        private SpawnInstitutionAction $spawnAction,
        private CollapseInstitutionAction $collapseAction,
        private ActorRepositoryInterface $actorRepository,
        private SpawnActorAction $spawnActorAction,
        private \App\Modules\Institutions\Actions\DetectEmergentCivilizationsAction $detectEmergentCivsAction
    ) {}

    public function processPulse(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $tick = (int) $snapshot->tick;
        $entities = $this->institutionalRepository->findActiveByUniverse($universe->id);
        $zones = ($universe->state_vector ?? [])['zones'] ?? [];
        $instability = (float) ($snapshot->stability_index ?? 1.0);

        // 1. Evolution of existing entities
        foreach ($entities as $entity) {
            $entity->tick($zones);

            if ($entity->orgCapacity <= 0.5) {
                $this->collapseAction->handle($entity, $tick);
            } else {
                $this->institutionalRepository->save($entity);
            }
        }

        // 2. Detect New Civilizations (Clustering)
        $this->detectEmergentCivsAction->handle($universe, $snapshot);

        // 3. Potential spawning of other types (Cults, Rebels)
        $this->handlePotentialSpawning($universe, $tick, $zones);

        // Crisis management
        if ($instability < 0.4) {
            $this->manageInstitutionalCrisis($universe, $entities, $tick);
        }
    }

    protected function handlePotentialSpawning(Universe $universe, int $tick, array $zones): void
    {
        if (mt_rand(0, 10) > 3) return;

        foreach ($zones as $zone) {
            $stress = (float) ($zone['state']['material_stress'] ?? ($zone['material_stress'] ?? 0));
            $culture = $zone['culture'] ?? [];
            
            if ($stress > 0.8 && mt_rand(0, 5) === 0) {
                $this->spawnAction->handle($universe, $zone['id'], $tick, 'rebel');
                return;
            }

            if (($culture['myth'] ?? 0) > 0.85 && mt_rand(0, 5) === 0) {
                $this->spawnAction->handle($universe, $zone['id'], $tick, 'cult');
                return;
            }
        }
    }

    protected function manageInstitutionalCrisis(Universe $universe, array $entities, int $tick): void
    {
        if ($this->actorRepository->getActiveCount($universe->id) >= 15) return;

        foreach ($entities as $entity) {
            if ($entity->orgCapacity > 60 && mt_rand(0, 5) === 0) {
                $this->spawnInstitutionalLeader($universe, $entity, $tick);
            }
        }
    }

    private function spawnInstitutionalLeader(Universe $universe, $entity, int $tick): void
    {
        $this->spawnActorAction->handle([
            'universe_id' => $universe->id,
            'name' => 'Lãnh đạo của ' . $entity->name,
            'archetype' => 'Leader',
            'biography' => "Trỗi dậy để dẫn dắt {$entity->name} qua thời kỳ đen tối.",
            'metrics' => ['influence' => $entity->orgCapacity / 15.0]
        ]);
    }
}
