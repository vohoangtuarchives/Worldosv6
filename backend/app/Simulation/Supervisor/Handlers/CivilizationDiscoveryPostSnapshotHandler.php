<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\CivilizationDiscoveryService;

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
