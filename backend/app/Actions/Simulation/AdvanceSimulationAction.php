<?php

namespace App\Actions\Simulation;

use App\Simulation\Supervisor\SimulationSupervisor;
use App\Services\Simulation\SimulationTracer;

/**
 * Facade for advance simulation: delegates to SimulationSupervisor (Phase 2 refactor).
 */
class AdvanceSimulationAction
{
    public function __construct(
        protected SimulationSupervisor $supervisor
    ) {}

    public function execute(int $universeId, int $ticks): array
    {
        return SimulationTracer::span('advance_simulation', function () use ($universeId, $ticks) {
            return $this->supervisor->execute($universeId, $ticks);
        });
    }
}
