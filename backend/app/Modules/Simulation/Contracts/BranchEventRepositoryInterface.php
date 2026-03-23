<?php

namespace App\Modules\Simulation\Contracts;

use App\Modules\Simulation\Entities\BranchEventEntity;

interface BranchEventRepositoryInterface
{
    public function findById(int $id): ?BranchEventEntity;
    public function save(BranchEventEntity $entity): BranchEventEntity;
    public function existsFork(int $universeId, int $fromTick): bool;
    public function hasForkAsParent(int $universeId): bool;
}
