<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Modules\Simulation\Services\CivilizationDiscoveryService;

final class CivilizationDiscoveryPostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly CivilizationDiscoveryService $civilizationDiscoveryService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->civilizationDiscoveryService->evaluate($universe, (int) $snapshot->tick, $snapshot);
    }
}

