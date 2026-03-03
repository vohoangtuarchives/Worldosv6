<?php

namespace App\Modules\Institutions\Contracts;

use App\Modules\Institutions\Entities\SupremeEntity;

interface SupremeEntityRepositoryInterface
{
    public function findById(int $id): ?SupremeEntity;
    
    /**
     * @return SupremeEntity[]
     */
    public function findByUniverse(int $universeId): array;
    
    public function save(SupremeEntity $entity): void;
}
