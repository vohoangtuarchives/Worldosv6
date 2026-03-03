<?php

namespace App\Services\Simulation;

use App\Contracts\SimulationEngineClientInterface;
use App\Models\Universe;
use App\Models\BranchEvent;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Simulation\CultureDiffusionService;
use App\Services\Simulation\DecisionEngine;
use App\Services\Simulation\InstitutionalEngine;

class UniverseRuntimeService
{
    public function __construct(
        protected SimulationEngineClientInterface $engine,
        protected UniverseSnapshotRepository $snapshots,
        protected ?MaterialLifecycleEngine $materialLifecycle = null,
        protected ?NarrativeAiService $narrativeAi = null,
        protected ?CultureDiffusionService $cultureDiffusion = null,
        protected ?InstitutionalEngine $institutionalEngine = null,
        protected ?MultiverseInteractionService $multiverseInteraction = null,
        protected ?AutonomyEngine $autonomyEngine = null,
        protected ?\App\Actions\Simulation\SocialContractEvolutionAction $evolutionAction = null,
        protected ?GreatFilterEngine $greatFilter = null,
        protected ?WorldWillEngine $worldWill = null,
        protected ?\App\Actions\Simulation\AscensionAction $ascensionAction = null,
        protected ?\App\Actions\Simulation\CelestialEngineeringAction $celestialEngineering = null,
        protected ?ConvergenceEngine $convergenceEngine = null
    ) {}

    /**
     * Advance universe by N ticks. Delegating to the new refactored Action.
     */
    public function advance(int $universeId, int $ticks): array
    {
        return app(\App\Actions\Simulation\AdvanceSimulationAction::class)->execute($universeId, $ticks);
    }

    /**
     * Build context array for Material Lifecycle (entropy, order, innovation, etc. from snapshot).
     */
    protected function buildMaterialContext(array $snapshot, array $stateVector, array $metrics): array
    {
        $entropy = $snapshot['entropy'] ?? 0;
        $stability = $snapshot['stability_index'] ?? 0;
        
        // Extract scars from state vector
        $scars = [];
        if (isset($stateVector['scars']) && is_array($stateVector['scars'])) {
            $scars = $stateVector['scars'];
        }

        // Count ontology types for resonance
        // This would require fetching material instances, but for now we pass empty or simplified
        // Ideally MaterialLifecycleEngine should handle aggregation, but we can pass hints here.

        return array_merge($metrics, [
            'entropy' => is_numeric($entropy) ? (float) $entropy : 0,
            'order' => is_numeric($stability) ? (float) $stability : 0,
            'innovation' => $metrics['innovation'] ?? 0,
            'growth' => $metrics['growth'] ?? 0,
            'trauma' => $metrics['trauma'] ?? 0,
            'scars' => $scars,
        ]);
    }
}
