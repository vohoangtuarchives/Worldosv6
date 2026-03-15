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
        protected \App\Simulation\Engines\AutopoieticEvolutionEngine $evolutionEngine,
        protected \App\Services\Simulation\RuleMutationService $mutationService,
        protected \App\Simulation\Engines\InformationPropagationEngine $infoEngine,
        protected \App\Simulation\Engines\PowerStructureEngine $powerEngine,
        protected \App\Simulation\Engines\CulturalAttractorEngine $cultureEngine,
        protected \App\Simulation\Engines\MythogenesisEngine $mythEngine,
        protected \App\Simulation\Engines\MeaningEngine $meaningEngine,
        protected \App\Simulation\Engines\KnowledgeEvolutionEngine $knowledgeEngine,
        protected \App\Simulation\Engines\CivilizationPhaseTransitionEngine $phaseEngine,
        protected \App\Simulation\Engines\SingularityStabilityEngine $stabilityEngine,
        protected \App\Simulation\Engines\AscensionEngine $ascensionEngine,
        protected \App\Services\Simulation\ZenithMetricsService $metricsService
    ) {}

    /**
     * @param  array<string, mixed>  $context  Optional context (e.g. engine response) passed to each stage
     */
    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        // Phase 37: Load Universal State
        $state = $this->stateManager->load($universe, $savedSnapshot);

        foreach ($this->scheduler->stageOrder() as $key) {
            $stage = $this->stages[$key] ?? null;
            if (!$stage instanceof SimulationStageInterface) {
                continue;
            }
            if (!$this->scheduler->shouldRun($key, $tick)) {
                continue;
            }

            // Phase 70: Event-Driven Gating (Performance Optimization)
            if (!$this->performanceScheduler->shouldExecute($key, $state)) {
                continue;
            }

            try {
                $tracing = Config::get('worldos.observability.tracing_enabled', false);
                if ($tracing) {
                    $start = microtime(true);
                    SimulationTracer::span("stage.{$key}", function () use ($stage, $universe, $tick, $savedSnapshot, $context) {
                        $stage->run($universe, $tick, $savedSnapshot, $context);
                    });
                    $durationMs = (microtime(true) - $start) * 1000;
                    Cache::put("worldos.engine_execution_ms.{$universe->id}.{$key}", round($durationMs, 2), now()->addHours(1));
                } else {
                    $stage->run($universe, $tick, $savedSnapshot, $context);
                }
                $universe->refresh();
            } catch (\Throwable $e) {
                Log::error("SimulationTickPipeline: stage failed", [
                    'stage' => $key,
                    'universe_id' => $universe->id,
                    'tick' => $tick,
                    'message' => $e->getMessage(),
                ]);
                throw $e;
            }
        }

        // Phase 71: Advanced Civilization Dynamics (V10)
        $this->infoEngine->run($state, $tick);
        $this->powerEngine->run($state, $tick);
        $this->cultureEngine->run($state, $tick);
        $this->mythEngine->run($state, $tick);
        $this->meaningEngine->run($state, $tick);
        $this->knowledgeEngine->run($state, $tick);
        $this->phaseEngine->run($state, $tick);



        // Phase 72: Singularity Stability & Final Balancing
        $this->stabilityEngine->run($state, $tick);

        // Final Phase: Autopoietic Ascension (THE ZENITH)
        $this->ascensionEngine->run($state, $tick);

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
