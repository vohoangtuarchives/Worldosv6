<?php

namespace App\Modules\Simulation\Core\Runtime;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\UniverseSnapshot;
use App\Modules\Simulation\Services\SimulationTracer;
use App\Modules\Simulation\Core\Runtime\Contracts\SimulationStageInterface;
use App\Modules\Simulation\Core\Runtime\Contracts\TickSchedulerInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

final class SimulationTickPipeline
{
    /**
     * @param  array<string, SimulationStageInterface>  $stages  Stage key => stage instance
     */
    public function __construct(
        protected TickSchedulerInterface $scheduler,
        protected array $stages,
        protected \App\Modules\Simulation\Core\Runtime\State\StateManager $stateManager,
        protected \App\Modules\Simulation\Core\Runtime\EventDrivenScheduler $performanceScheduler,
        protected \App\Modules\Simulation\Core\Engines\Biological\AutopoieticEvolutionEngine $evolutionEngine,
        protected \App\Modules\Simulation\Services\RuleMutationService $mutationService,
        protected \App\Modules\Simulation\Core\Engines\Meta\InformationPropagationEngine $infoEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\PowerStructureEngine $powerEngine,
        protected \App\Modules\Simulation\Core\Engines\Social\CulturalAttractorEngine $cultureEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\MythogenesisEngine $mythEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\MeaningEngine $meaningEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\KnowledgeEvolutionEngine $knowledgeEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\ThermodynamicPhaseEngine $phaseEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\SingularityStabilityEngine $stabilityEngine,
        protected \App\Modules\Simulation\Core\Engines\Meta\AscensionEngine $ascensionEngine,
        protected \App\Modules\Simulation\Services\ZenithMetricsService $metricsService,
        protected \App\Modules\Simulation\Core\Engines\Meta\CausalHistoryEngine $causalHistoryEngine,
        protected \App\Modules\Simulation\Core\Runtime\WorldKernel $kernel,
        protected \App\Modules\Narrative\Services\NarrativeEngine $narrativeEngine
    ) {}

    /**
     * @param  array<string, mixed>  $context  Optional context (e.g. engine response) passed to each stage
     */
    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        // Phase 37: Load Universal State
        $state = $this->stateManager->load($universe, $savedSnapshot);

        // Phase 80: High-Fidelity Orchestration (§World-Kernel Architecture)
        // Laravel backend acts as the Orchestrator for all 5 Phases (Environment -> Life -> Mind -> Social -> Meta)
        // All heavy lifting (Mass Actors, DSL, Physics) is dispatched to Rust/DSL via Systems in the Kernel.
        $this->kernel->execute($state, $tick);

        // Phase 72: Collect Zenith Meta-Metrics
        $metrics = $this->metricsService->getZenithReport($state);
        foreach ($metrics as $key => $values) {
            foreach ($values as $subKey => $val) {
                $state->set("meta.zenith.{$key}.{$subKey}", $val);
            }
        }

        // Phase 37: Save Universal State
        $this->stateManager->save($universe);

        // Phase 80: Narrative Integration (Rewrite)
        // 1 Tick = 1 LLM Call. Pulse the Narrative Engine after state persistence.
        $universeModel = \App\Modules\Simulation\Models\Universe::find($universe->id);
        $snapshotModel = $savedSnapshot ?? \App\Modules\Simulation\Models\UniverseSnapshot::where('universe_id', $universe->id)->where('tick', $tick)->first();
        
        if ($universeModel && $snapshotModel) {
            $universeEntity = app(\App\Modules\Simulation\Contracts\UniverseRepositoryInterface::class)->findById($universe->id);
            $this->narrativeEngine->pulse($universeEntity, $snapshotModel);
        }
    }
}



