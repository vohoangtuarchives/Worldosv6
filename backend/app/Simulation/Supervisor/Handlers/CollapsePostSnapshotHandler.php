<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\CivilizationCollapseEngine;

final class CollapsePostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly CivilizationCollapseEngine $collapseEngine,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->collapseEngine->evaluate($universe, $snapshot);
    }
}
