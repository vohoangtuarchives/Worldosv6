<?php

namespace App\Simulation\Concerns;

/**
 * Doc 21 §6: Default phase group 'default' for engines that do not yet use phase groups.
 */
trait DefaultSimulationEnginePhase
{
    use HasEngineVersion;

    public function phase(): string
    {
        return 'default';
    }
}
