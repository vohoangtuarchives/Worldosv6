<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Services\Material\MaterialLifecycleEngine;
use App\Repositories\UniverseRepository;
use Illuminate\Contracts\Queue\ShouldQueue;

class ProcessMaterialLifecycle implements ShouldQueue
{
    public function __construct(
        protected MaterialLifecycleEngine $materialLifecycle,
        protected UniverseRepository $universeRepository
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;
        
        $context = $this->buildMaterialContext($snapshot);
        $deltas = $this->materialLifecycle->processTick($universe->id, (int)$snapshot->tick, $context);
        
        if (!empty($deltas)) {
            $vec = $universe->state_vector ?? [];
            $vec['entropy'] = ($vec['entropy'] ?? 0.0) + ($deltas['entropy'] ?? 0.0);
            $vec['stability_index'] = ($vec['stability_index'] ?? 0.0) + ($deltas['order'] ?? 0.0);
            $vec['innovation'] = ($vec['innovation'] ?? 0.0) + ($deltas['innovation'] ?? 0.0);
            $vec['growth'] = ($vec['growth'] ?? 0.0) + ($deltas['growth'] ?? 0.0);
            $vec['trauma'] = ($vec['trauma'] ?? 0.0) + ($deltas['trauma'] ?? 0.0);

            // Clamp
            $vec['entropy'] = max(0.0, min(1.0, (float)$vec['entropy']));
            $vec['stability_index'] = max(0.0, min(1.0, (float)$vec['stability_index']));
            
            $this->universeRepository->update($universe->id, ['state_vector' => $vec]);
        }
    }

    protected function buildMaterialContext($snapshot): array
    {
        $metrics = $snapshot->metrics ?? [];
        return array_merge($metrics, [
            'entropy' => (float)($snapshot->entropy ?? 0),
            'order' => (float)($snapshot->stability_index ?? 0),
            'innovation' => $metrics['innovation'] ?? 0,
            'growth' => $metrics['growth'] ?? 0,
            'trauma' => $metrics['trauma'] ?? 0,
            'scars' => $snapshot->state_vector['scars'] ?? [],
        ]);
    }
}
