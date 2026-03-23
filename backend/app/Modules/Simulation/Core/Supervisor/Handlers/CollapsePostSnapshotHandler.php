<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Modules\Intelligence\Services\CivilizationCollapseEngine;

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

