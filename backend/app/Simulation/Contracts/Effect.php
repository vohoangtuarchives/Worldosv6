<?php

namespace App\Simulation\Contracts;

use App\Simulation\Runtime\State\WorldStateMutable;

interface Effect
{
    public function apply(WorldStateMutable $state): void;
}
