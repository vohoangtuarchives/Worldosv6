<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\UniverseSnapshot;
use App\Modules\Simulation\Services\UrbanStressAgricultureService;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
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

