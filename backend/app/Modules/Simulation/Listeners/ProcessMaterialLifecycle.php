<?php

namespace App\Modules\Simulation\Listeners;

use App\Modules\Simulation\Events\UniverseSimulationPulsed;
use App\Modules\World\Services\MaterialLifecycleEngine;
use App\Modules\Simulation\Core\Engines\Physics\MaterialEvolutionEngine;
use App\Modules\Simulation\Core\Engines\Meta\OmegaEngine;
use App\Modules\Simulation\Core\Engines\Meta\AscensionEngine;
use App\Modules\Simulation\Repositories\UniverseRepository;
use Illuminate\Contracts\Queue\ShouldQueue;

class ProcessMaterialLifecycle implements ShouldQueue
{
    public function __construct(
        protected MaterialLifecycleEngine $materialLifecycle,
        protected MaterialEvolutionEngine $materialEvolution,
        protected OmegaEngine $omegaEngine,
        protected AscensionEngine $ascensionEngine,
        protected UniverseRepository $universeRepository
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;
        
        $context = $this->buildMaterialContext($snapshot);
        $deltas = $this->materialLifecycle->process($context, (int)$snapshot->tick);
        
        if (!empty($deltas)) {
            // ... (existing delta logic)
            $this->applyDeltas($universe, $deltas);
        }

        // V6: Advanced Material Evolution — Now handled by WorldKernel PHASE_ENVIRONMENT
        // Omega States & Ascension (§49, §50)
        $this->omegaEngine->checkOmegaStatus($universe, $context);
        $this->ascensionEngine->processAscension($universe, $context);
    }

    protected function applyDeltas($universe, $deltas): void
    {
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

    protected function buildMaterialContext($snapshot): array
    {
        $metrics = $snapshot->metrics ?? [];
        return array_merge($metrics ?? [], [
            'entropy' => (float)($snapshot->entropy ?? 0),
            'order' => (float)($snapshot->stability_index ?? 0),
            'innovation' => $metrics['innovation'] ?? 0,
            'growth' => $metrics['growth'] ?? 0,
            'trauma' => $metrics['trauma'] ?? 0,
            'scars' => ($snapshot->state_vector ?? [])['scars'] ?? [],
        ]);
    }
}


