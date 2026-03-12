<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\UrbanStressAgricultureService;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use Illuminate\Support\Facades\Config;

final class UrbanStressAgriculturePostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly UrbanStressAgricultureService $urbanStressAgricultureService
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        if (! Config::get('worldos.urban_stress_agriculture.enabled', true)) {
            return;
        }
        $this->urbanStressAgricultureService->update($universe);
    }
}
