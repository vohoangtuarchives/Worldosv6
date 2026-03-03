<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Services\Simulation\CultureDiffusionService;
use App\Services\Simulation\InstitutionManager;
use Illuminate\Contracts\Queue\ShouldQueue;

class ManageInstitutions implements ShouldQueue
{
    public function __construct(
        protected CultureDiffusionService $cultureDiffusion,
        protected InstitutionManager $institutionManager
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;

        $this->cultureDiffusion->apply($universe);
        $this->institutionManager->update($universe, (int)$snapshot->tick, $snapshot->metrics ?? []);
    }
}
