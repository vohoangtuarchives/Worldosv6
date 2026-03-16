<?php

namespace App\Simulation\Runtime\Contracts;

use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;

interface WorldSystemInterface
{
    /**
     * Update the world state and return a mandatory ImpactReport for semantic history (§V81).
     */
    public function update(array $context, int $tick): ?ImpactReport;
}
