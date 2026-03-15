<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\RuleVmService;
use App\Simulation\Runtime\State\StateManager;
use function resource_path;
use function file_get_contents;
use function file_exists;

/**
 * RuleStage – Executes the Rule VM (DSL) as an orchestrated stage.
 * 
 * This treats the DSL rules (Axioms, Meta-rules) as a first-class simulation step,
 * allowing them to modify the world state before or after other stages.
 */
final class RuleStage implements SimulationStageInterface
{
    public function __construct(
        protected RuleVmService $ruleVmService,
        protected \App\Services\Simulation\HistoricalCycleEngine $historicalCycleEngine,
        protected \App\Modules\Intelligence\Services\InnovationEngine $innovationEngine,
        protected \App\Simulation\Engines\LawEvolutionEngine $lawEngine,
        protected \App\Modules\Simulation\Services\CausalCorrectionEngine $causalEngine,
        protected \App\Modules\Simulation\Services\ObservationInterferenceEngine $observationEngine,
        protected \App\Simulation\Engines\HistoricalScarsEngine $scarsEngine,
        protected \App\Simulation\Engines\MetaAttractorEngine $metaAttractorEngine,
        protected \App\Simulation\Engines\CivilizationPhysicsEngine $physicsEngine,
        protected \App\Simulation\Engines\CausalHistoryEngine $causalHistoryEngine,
        protected \App\Simulation\Engines\ResonanceBleedingEngine $resonanceEngine,
        protected \App\Simulation\Engines\DynamicLawEngine $dynamicLawEngine,
        protected \App\Simulation\Engines\RealityAnchorEngine $anchorEngine,
        protected \App\Simulation\Engines\DeepTimeMemoryEngine $memoryEngine,
        protected \App\Simulation\Engines\CausalBridgeEngine $bridgeEngine,
        protected \App\Simulation\Engines\HigherDimensionalEngine $higherDimEngine,
        protected \App\Simulation\Engines\InfiniteRecursionEngine $recursionEngine,
        protected \App\Simulation\Engines\IdealismEngine $idealismEngine,
        protected \App\Simulation\Engines\SingularityEngine $singularityEngine,
        protected \App\Simulation\Engines\InformationDensityEngine $infoDensityEngine,
        protected \App\Simulation\Engines\PostApotheosisEngine $postApotheosisEngine,
        protected \App\Simulation\Engines\OmegaConvergenceEngine $omegaEngine,
        protected StateManager $stateManager
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        // Skip if simulation is collapsed
        if ($universe->status === 'collapsed') {
            return;
        }

        // 1. Evaluate DSL Rules (Axioms, History, etc.)
        $this->ruleVmService->evaluateAndApply($universe, $savedSnapshot);

        // 2. Process Meta-History Cycles (Phase 42)
        $state = $this->stateManager->get();
        if ($state) {
            $this->historicalCycleEngine->runWithState($state, $tick);

            // Phase 48: Innovation & Stagnation
            $this->innovationEngine->runWithState($state, $tick);

            // Phase 48: Law Evolution (Leadership)
            $this->lawEngine->runWithState($state, $tick);

            // Phase 48: Causal Integrity (Overlords Rebalancing)
            $this->causalEngine->runWithState($state, $tick);

            // Phase 49: Quantum Observer & Wavefunction Collapse
            $this->observationEngine->runWithState($state, $tick);

            // Phase 51: Causal Scars & Historical Momentum
            $this->scarsEngine->runWithState($state, $tick);

            // Phase 54: Civilization Field Physics (V8)
            $this->physicsEngine->runWithState($state, $tick);

            // Phase 55: Meta-Attractor Graph Engine (V8 Core)
            $this->metaAttractorEngine->runWithState($state, $tick);
            $metaAttractorsDsl = resource_path('worldos_rules/simulation/meta_attractors.dsl');
            if (file_exists($metaAttractorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($metaAttractorsDsl), $tick);
            }

            // Phase 55: Causal History & Reasoning Engine (V8 Core)
            $this->causalHistoryEngine->runWithState($state, $tick);

            // Phase 61: Deep Time Memory (Epochal Scars)
            $this->memoryEngine->runWithState($state, $tick);

            // Phase 58: Heroic Reality Anchors
            $this->anchorEngine->runWithState($state, $tick);
            $anchorsDsl = resource_path('worldos_rules/simulation/anchors.dsl');
            if (file_exists($anchorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($anchorsDsl), $tick);
            }

            // Phase 55: Meta-Attractor Graph Engine (V8 Core)
            $this->metaAttractorEngine->runWithState($state, $tick);
            $metaAttractorsDsl = resource_path('worldos_rules/simulation/meta_attractors.dsl');
            if (file_exists($metaAttractorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($metaAttractorsDsl), $tick);
            }

            // Phase 55: Civilization Field Physics Engine (V8 Core)
            $this->physicsEngine->runWithState($state, $tick);
            $fieldPhysicsDsl = resource_path('worldos_rules/simulation/field_physics.dsl');
            if (file_exists($fieldPhysicsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($fieldPhysicsDsl), $tick);
            }

            // Phase 57: Dynamic Metaphysical Axioms
            $this->dynamicLawEngine->runWithState($state, $tick);

            // Phase 56: Multi-Dimensional Superposition (Reality Bleeding)
            $this->resonanceEngine->runWithState($state, $tick);
            $superpositionDsl = resource_path('worldos_rules/multiverse/superposition.dsl');
            if (file_exists($superpositionDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($superpositionDsl), $tick);
            }

            // Phase 62: Multiverse Causal Bridges (Traversing Realities)
            $this->bridgeEngine->runWithState($state, $tick);
            $bridgesDsl = resource_path('worldos_rules/multiverse/bridges.dsl');
            if (file_exists($bridgesDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($bridgesDsl), $tick);
            }

            // Phase 63: Civilizational Meta-Observation (Post-Apotheosis)
            $this->postApotheosisEngine->runWithState($state, $tick);
            $ascendanceDsl = resource_path('worldos_rules/simulation/ascendance.dsl');
            if (file_exists($ascendanceDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($ascendanceDsl), $tick);
            }

            // Phase 64: The Omega Point Convergence (Final Convergence)
            $this->omegaEngine->runWithState($state, $tick);
            $omegaDsl = resource_path('worldos_rules/multiverse/omega.dsl');
            if (file_exists($omegaDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($omegaDsl), $tick);
            }
            // Phase 65: Dimensional Ascension (Hyper-reality)
            $this->higherDimEngine->runWithState($state, $tick);
            $hyperspaceDsl = resource_path('worldos_rules/simulation/hyperspace.dsl');
            if (file_exists($hyperspaceDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($hyperspaceDsl), $tick);
            }

            // Phase 66: Infinite Recursion (The Self-Simulation Paradox)
            $this->recursionEngine->runWithState($state, $tick);
            $recursionDsl = resource_path('worldos_rules/simulation/recursion.dsl');
            if (file_exists($recursionDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($recursionDsl), $tick);
            }

            // Phase 67: Idealism Engine (Subjective Physics)
            $this->idealismEngine->runWithState($state, $tick);
            $idealismDsl = resource_path('worldos_rules/simulation/idealism.dsl');
            if (file_exists($idealismDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($idealismDsl), $tick);
            }

            // Phase 68: Singularity Engine (The Origin Point)
            $this->singularityEngine->runWithState($state, $tick);
            $singularityDsl = resource_path('worldos_rules/simulation/singularity.dsl');
            if (file_exists($singularityDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($singularityDsl), $tick);
            }

            // Phase 69: Terminal Horizon (Information Saturation)
            $this->infoDensityEngine->runWithState($state, $tick);
            $horizonDsl = resource_path('worldos_rules/simulation/horizon.dsl');
            if (file_exists($horizonDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($horizonDsl), $tick);
            }
        }
    }
}
