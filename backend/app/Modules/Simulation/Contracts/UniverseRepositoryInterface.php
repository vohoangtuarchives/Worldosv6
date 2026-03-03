<?php

namespace App\Modules\Simulation\Contracts;

use App\Modules\Simulation\Entities\UniverseEntity;

interface UniverseRepositoryInterface
{
    public function findById(int $id): ?UniverseEntity;
    public function save(UniverseEntity $universe): void;
}
