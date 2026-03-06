<?php

namespace App\Simulation\Contracts;

use App\Simulation\Domain\WorldStateMutable;

interface Effect
{
    public function apply(WorldStateMutable $state): void;
}
