<?php

namespace App\Simulation\Runtime;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\SimulationTracer;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Runtime\Contracts\TickSchedulerInterface;
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
        protected \App\Simulation\Runtime\State\StateManager $stateManager,
        protected \App\Simulation\Runtime\EventDrivenScheduler $performanceScheduler,
        protected \App\Simulation\Engines\Biological\AutopoieticEvolutionEngine $evolutionEngine,
        protected \App\Services\Simulation\RuleMutationService $mutationService,
        protected \App\Simulation\Engines\Meta\InformationPropagationEngine $infoEngine,
        protected \App\Simulation\Engines\Meta\PowerStructureEngine $powerEngine,
        protected \App\Simulation\Engines\Social\CulturalAttractorEngine $cultureEngine,
        protected \App\Simulation\Engines\Meta\MythogenesisEngine $mythEngine,
        protected \App\Simulation\Engines\Meta\MeaningEngine $meaningEngine,
        protected \App\Simulation\Engines\Meta\KnowledgeEvolutionEngine $knowledgeEngine,
        protected \App\Simulation\Engines\Meta\CivilizationPhaseTransitionEngine $phaseEngine,
        protected \App\Simulation\Engines\Meta\SingularityStabilityEngine $stabilityEngine,
        protected \App\Simulation\Engines\Meta\AscensionEngine $ascensionEngine,
        protected \App\Services\Simulation\ZenithMetricsService $metricsService,
        protected \App\Simulation\Runtime\WorldKernel $kernel
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
    }
}
