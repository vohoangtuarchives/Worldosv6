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
        protected \App\Simulation\Engines\Meta\HistoricalCycleEngine $historicalCycleEngine,
        protected \App\Modules\Intelligence\Services\InnovationEngine $innovationEngine,
        protected \App\Simulation\Engines\Meta\LawEvolutionEngine $lawEngine,
        protected \App\Modules\Simulation\Services\CausalCorrectionEngine $causalEngine,
        protected \App\Modules\Simulation\Services\ObservationInterferenceEngine $observationEngine,
        protected \App\Simulation\Engines\Meta\HistoricalScarsEngine $scarsEngine,
        protected \App\Simulation\Engines\Meta\MetaAttractorEngine $metaAttractorEngine,
        protected \App\Simulation\Engines\Social\CivilizationPhysicsEngine $physicsEngine,
        protected \App\Simulation\Engines\Meta\CausalHistoryEngine $causalHistoryEngine,
        protected \App\Simulation\Engines\Meta\ResonanceBleedingEngine $resonanceEngine,
        protected \App\Simulation\Engines\Meta\DynamicLawEngine $dynamicLawEngine,
        protected \App\Simulation\Engines\Physics\RealityAnchorEngine $anchorEngine,
        protected \App\Simulation\Engines\Meta\DeepTimeMemoryEngine $memoryEngine,
        protected \App\Simulation\Engines\Meta\CausalBridgeEngine $bridgeEngine,
        protected \App\Simulation\Engines\Meta\HigherDimensionalEngine $higherDimEngine,
        protected \App\Simulation\Engines\Meta\InfiniteRecursionEngine $recursionEngine,
        protected \App\Simulation\Engines\Meta\IdealismEngine $idealismEngine,
        protected \App\Simulation\Engines\Meta\SingularityEngine $singularityEngine,
        protected \App\Simulation\Engines\Meta\InformationDensityEngine $infoDensityEngine,
        protected \App\Simulation\Engines\Meta\PostApotheosisEngine $postApotheosisEngine,
        protected \App\Simulation\Engines\Meta\OmegaConvergenceEngine $omegaEngine,
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
            $ctx = new \App\Simulation\Domain\TickContext((int) ($universe->id ?? 0), $tick, (int) ($universe->seed ?? 0));

            $this->historicalCycleEngine->runWithState($state, $tick);

            // Phase 48: Innovation & Stagnation
            $this->innovationEngine->runWithState($state, $tick);

            // Phase 48: Law Evolution (Leadership)
            $this->lawEngine->handle($state, $ctx);

            // Phase 48: Causal Integrity (Overlords Rebalancing)
            $this->causalEngine->runWithState($state, $tick);

            // Phase 49: Quantum Observer & Wavefunction Collapse
            $this->observationEngine->runWithState($state, $tick);

            // Phase 51: Causal Scars & Historical Momentum
            $this->scarsEngine->handle($state, $ctx);

            // Phase 54: Civilization Field Physics (V8)
            $this->physicsEngine->handle($state, $ctx);

            // Phase 55: Meta-Attractor Graph Engine (V8 Core)
            $this->metaAttractorEngine->handle($state, $ctx);
            $metaAttractorsDsl = resource_path('worldos_rules/simulation/meta_attractors.dsl');
            if (file_exists($metaAttractorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($metaAttractorsDsl), $tick);
            }

            // Phase 55: Causal History & Reasoning Engine (V8 Core)
            $this->causalHistoryEngine->handle($state, $ctx);

            // Phase 61: Deep Time Memory (Epochal Scars)
            $this->memoryEngine->handle($state, $ctx);

            // Phase 58: Heroic Reality Anchors
            $this->anchorEngine->handle($state, $ctx);
            $anchorsDsl = resource_path('worldos_rules/simulation/anchors.dsl');
            if (file_exists($anchorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($anchorsDsl), $tick);
            }

            // Phase 55: Meta-Attractor Graph Engine (V8 Core) - Duplicate call preserved for logic parity
            $this->metaAttractorEngine->handle($state, $ctx);
            $metaAttractorsDsl = resource_path('worldos_rules/simulation/meta_attractors.dsl');
            if (file_exists($metaAttractorsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($metaAttractorsDsl), $tick);
            }

            // Phase 55: Civilization Field Physics Engine (V8 Core) - Duplicate call preserved for logic parity
            $this->physicsEngine->handle($state, $ctx);
            $fieldPhysicsDsl = resource_path('worldos_rules/simulation/field_physics.dsl');
            if (file_exists($fieldPhysicsDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($fieldPhysicsDsl), $tick);
            }

            // Phase 57: Dynamic Metaphysical Axioms
            $this->dynamicLawEngine->handle($state, $ctx);

            // Phase 56: Multi-Dimensional Superposition (Reality Bleeding)
            $this->resonanceEngine->handle($state, $ctx);
            $superpositionDsl = resource_path('worldos_rules/multiverse/superposition.dsl');
            if (file_exists($superpositionDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($superpositionDsl), $tick);
            }

            // Phase 62: Multiverse Causal Bridges (Traversing Realities)
            $this->bridgeEngine->handle($state, $ctx);
            $bridgesDsl = resource_path('worldos_rules/multiverse/bridges.dsl');
            if (file_exists($bridgesDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($bridgesDsl), $tick);
            }

            // Phase 63: Civilizational Meta-Observation (Post-Apotheosis)
            $this->postApotheosisEngine->handle($state, $ctx);
            $ascendanceDsl = resource_path('worldos_rules/simulation/ascendance.dsl');
            if (file_exists($ascendanceDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($ascendanceDsl), $tick);
            }

            // Phase 64: The Omega Point Convergence (Final Convergence)
            $this->omegaEngine->handle($state, $ctx);
            $omegaDsl = resource_path('worldos_rules/multiverse/omega.dsl');
            if (file_exists($omegaDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($omegaDsl), $tick);
            }
            // Phase 65: Dimensional Ascension (Hyper-reality)
            $this->higherDimEngine->handle($state, $ctx);
            $hyperspaceDsl = resource_path('worldos_rules/simulation/hyperspace.dsl');
            if (file_exists($hyperspaceDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($hyperspaceDsl), $tick);
            }

            // Phase 66: Infinite Recursion (The Self-Simulation Paradox)
            $this->recursionEngine->handle($state, $ctx);
            $recursionDsl = resource_path('worldos_rules/simulation/recursion.dsl');
            if (file_exists($recursionDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($recursionDsl), $tick);
            }

            // Phase 67: Idealism Engine (Subjective Physics)
            $this->idealismEngine->handle($state, $ctx);
            $idealismDsl = resource_path('worldos_rules/simulation/idealism.dsl');
            if (file_exists($idealismDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($idealismDsl), $tick);
            }

            // Phase 68: Singularity Engine (The Origin Point)
            $this->singularityEngine->handle($state, $ctx);
            $singularityDsl = resource_path('worldos_rules/simulation/singularity.dsl');
            if (file_exists($singularityDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($singularityDsl), $tick);
            }

            // Phase 69: Terminal Horizon (Information Saturation)
            $this->infoDensityEngine->handle($state, $ctx);
            $horizonDsl = resource_path('worldos_rules/simulation/horizon.dsl');
            if (file_exists($horizonDsl)) {
                $this->ruleVmService->evaluateAndApplyWithState($state, file_get_contents($horizonDsl), $tick);
            }
        }
    }
}
