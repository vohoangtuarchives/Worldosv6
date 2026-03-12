<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\DemographicRatesService;

final class DemographicRatesPostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly DemographicRatesService $demographicRatesService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->demographicRatesService->evaluate($universe, (int) $snapshot->tick);
    }
}
