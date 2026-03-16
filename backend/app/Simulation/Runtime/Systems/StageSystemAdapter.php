<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

/**
 * StageSystemAdapter – Wraps Simulation Stages to run as World Systems.
 */
class StageSystemAdapter implements WorldSystemInterface
{
    protected SimulationStageInterface $stage;
    protected ?Universe $universe = null;
    protected ?UniverseSnapshot $snapshot = null;

    public function __construct(SimulationStageInterface $stage, ?Universe $universe = null, ?UniverseSnapshot $snapshot = null)
    {
        $this->stage = $stage;
        $this->universe = $universe;
        $this->snapshot = $snapshot;
    }

    public function update(array $context, int $tick): ?ImpactReport
    {
        // Capture stage metadata for reporting
        $report = new ImpactReport(get_class($this->stage), 'Stage', 'Infrastructure');

        // Simulation Stages use Universe/Snapshot, not WorldState context yet.
        $this->stage->run($this->universe ?? new Universe(), $tick, $this->snapshot);

        return null;
    }
}
