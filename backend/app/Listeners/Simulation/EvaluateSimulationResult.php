<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ApplyMythScarAction;
use App\Actions\Simulation\RunMicroModeAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Actions\Simulation\TimelineMergeAction;
use App\Repositories\UniverseRepository;
use App\Services\Saga\SagaService;
use App\Services\Simulation\AttractorEngine;
use App\Services\Simulation\DynamicAttractorEngine;
use App\Services\Simulation\EventTriggerProcessor;
use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Modules\Simulation\Services\VoidExplorationEngine;
use App\Modules\Simulation\Services\EpochEngine;
use App\Modules\Simulation\Services\ObservationInterferenceEngine;
use App\Modules\Simulation\Services\TrajectoryModelingEngine;
use App\Simulation\Support\SimulationRandom;
use Illuminate\Contracts\Queue\ShouldQueue;

class EvaluateSimulationResult
{
    public function __construct(
        protected DecideUniverseAction $decideUniverseAction,
        protected ApplyMythScarAction $applyMythScarAction,
        protected RunMicroModeAction $runMicroModeAction,
        protected ForkUniverseAction $forkUniverseAction,
        protected SagaService $sagaService,
        protected UniverseRepository $universeRepository,
        protected UniverseRepositoryInterface $simulationUniverseRepository,
        protected \App\Modules\Simulation\Services\PressureCalculator $pressureCalculator,
        protected \App\Modules\Simulation\Services\CosmicPhaseDetector $cosmicPhaseDetector,
        protected \App\Modules\Institutions\Services\GreatFilterEngine $greatFilterEngine,
        protected \App\Modules\Institutions\Services\AscensionEngine $ascensionEngine,
        protected \App\Modules\Simulation\Services\ConvergenceEngine $convergenceEngine,
        protected \App\Modules\Institutions\Services\WorldEdictEngine $worldEdictEngine,
        protected \App\Modules\Institutions\Services\OmegaPointEngine $omegaPointEngine,
        protected \App\Modules\Institutions\Services\ZoneConflictEngine $zoneConflictEngine,
        protected VoidExplorationEngine $voidExplorationEngine,
        protected EpochEngine $epochEngine,
        protected \App\Modules\Simulation\Services\CausalCorrectionEngine $causalCorrectionEngine,
        protected \App\Modules\Simulation\Services\ResonanceEngine $resonanceEngine,
        protected ObservationInterferenceEngine $observationInterferenceEngine,
        protected TrajectoryModelingEngine $trajectoryModelingEngine,
        protected \App\Services\AI\EpistemicService $epistemicService,
        protected \App\Services\AI\NarrativeCompiler $narrativeCompiler,
        protected \App\Modules\Simulation\Services\MultiverseInteractionService $multiverseInteractionService,
        protected \App\Modules\Simulation\Services\WorldRegulatorEngine $worldRegulatorEngine,
        protected AttractorEngine $attractorEngine,
        protected DynamicAttractorEngine $dynamicAttractorEngine,
        protected EventTriggerProcessor $eventTriggerProcessor,
        protected \App\Modules\Simulation\Services\IdeologyEvolutionEngine $ideologyEvolutionEngine,
        protected \App\Modules\Simulation\Services\GreatPersonEngine $greatPersonEngine,
        protected \App\Services\Simulation\GreatPersonLegacyService $greatPersonLegacyService,
        protected TimelineMergeAction $timelineMergeAction,
        protected \App\Services\Simulation\MacroAgentSpawnService $macroAgentSpawnService,
        protected \App\Services\Simulation\CapabilityEngine $capabilityEngine,
        protected \App\Services\Simulation\ActorDecisionEngine $actorDecisionEngine,
        protected \App\Services\Simulation\ArtifactCreationEngine $artifactCreationEngine,
        protected \App\Services\Simulation\IdeaDiffusionEngine $ideaDiffusionEngine,
        protected \App\Services\Simulation\InstitutionDecayService $institutionDecayService,
        protected \App\Modules\Simulation\Services\EventNormalizer $eventNormalizer,
        protected \App\Services\Narrative\HistoricalFactEngine $historicalFactEngine,
        protected \App\Simulation\Contracts\WorldEventBusInterface $worldEventBus,
        protected \App\Services\Narrative\PerspectiveEngine $perspectiveEngine,
        protected \App\Services\Narrative\NarrativeMemoryGraphService $narrativeMemoryGraph,
        protected \App\Services\Narrative\NarrativeScheduler $narrativeScheduler,
        protected \App\Services\Narrative\EraDetector $eraDetector,
        protected \App\Services\Narrative\ReligionSpreadEngine $religionSpreadEngine,
        protected \App\Services\Narrative\ProphecyFulfillment $prophecyFulfillment,
        protected \App\Services\Simulation\CosmicEnergyPoolService $cosmicEnergyPoolService,
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;

        try {
            // Strategic Decision
            $decisionData = $this->decideUniverseAction->execute($snapshot);
            $action = $decisionData['action'] ?? 'continue';

            // 3. Apply Myth Scars
            $this->applyMythScarAction->execute($universe, $snapshot, $decisionData);

            // 4. Run Micro Mode
            $this->runMicroModeAction->execute($universe, $snapshot, $decisionData);

            // Seeded RNG for deterministic simulation (replayable)
            $rng = new SimulationRandom((int) ($universe->seed ?? 0), (int) $snapshot->tick, 0);

            // Emerging Civilizations (Handled by Institutions Module)
            $this->zoneConflictEngine->resolveConflicts($universe, $snapshot, $rng);

            // Attractor field: evaluate active attractors, persist to state_vector for event modulation
            $this->attractorEngine->evaluate($universe, $snapshot);
            $universe->refresh();

            // Dynamic attractors: decay instances, spawn from rules, merge into active_attractors
            $this->dynamicAttractorEngine->process($universe, $snapshot, $rng);
            $universe->refresh();

            // Event trigger processing (data-driven: rules, cooldown, probability → BranchEvent)
            $this->eventTriggerProcessor->process($universe, $snapshot, $rng);

            // Simulation Module Processing (DDD)
            $universeEntity = $this->simulationUniverseRepository->findById($universe->id);
            if ($universeEntity) {
                $this->voidExplorationEngine->process($universeEntity, (int)$snapshot->tick);
                $this->epochEngine->process($universeEntity, $snapshot);
                
                $isBeingObserved = $universe->last_observed_at && 
                                   $universe->last_observed_at->diffInSeconds(now()) < 30;
                $this->observationInterferenceEngine->process($universeEntity, (int)$snapshot->tick, $isBeingObserved);
                $this->trajectoryModelingEngine->process($universeEntity, (int)$snapshot->tick);
            }

            $this->convergenceEngine->process($universe, (int)$snapshot->tick);
            $this->causalCorrectionEngine->process($universe, $snapshot);
            $this->resonanceEngine->process($universe, $snapshot);

            // 6. Strategic Actions (Fork/Archive/Mutate/Merge/Promote) — AEE decisions (doc §13)
            if ($action === 'fork') {
                $this->handleFork($universe, (int)$snapshot->tick, $decisionData);
            } elseif ($action === 'merge') {
                $this->handleMerge($universe, $decisionData);
            } elseif ($action === 'promote') {
                $this->handlePromote($universe, $decisionData);
            } elseif ($action === 'continue' || $action === 'mutate') {
                $this->applySelectivePressure($universe, $snapshot, $decisionData);
            } elseif ($action === 'archive') {
                $tick = (int) ($snapshot->tick ?? 0);
                $minTicks = (int) config('worldos.autonomic.min_ticks_before_archive', 150);
                $forkGracePeriod = (int) config('worldos.autonomic.fork_grace_period_ticks', 50);
                $inGracePeriod = $universe->forked_at_tick !== null
                    && ($tick - (int) $universe->forked_at_tick) < $forkGracePeriod;
                if ($tick >= $minTicks && !$inGracePeriod) {
                    $this->universeRepository->update($universe->id, ['status' => 'archived']);
                }
            }

            // 6. Calculate & Store Pressure Metrics
            $this->storePressureMetrics($universe, $snapshot);

            // Power Economy: cosmic energy pool (after metrics final)
            $this->cosmicEnergyPoolService->processPulse($universe, $snapshot);
            $universe->refresh();

            // 6a. WorldEvent + Historical Fact (Phase 1–2): build event → record fact → publish event.
            if (config('worldos.narrative_v2.enable_world_event', true)) {
                try {
                    $worldEvent = $this->eventNormalizer->buildTickSummaryEvent($universe, $snapshot, $decisionData);
                    if ($worldEvent !== null) {
                        $this->historicalFactEngine->record($worldEvent, $snapshot);
                        $this->worldEventBus->publish($worldEvent);
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('EventNormalizer/HistoricalFact failed: ' . $e->getMessage());
                }
            }

            // 6b. Deep Sim Phase B: spawn macro agents (ruler/army) when conditions met; persist to state_vector
            $universe->refresh();
            try {
                $this->macroAgentSpawnService->spawnIfEligible($universe, $snapshot);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('MacroAgentSpawnService spawn failed: ' . $e->getMessage());
            }

            // 6c. Actor Decision (Phase 2): key actors → capabilities → action_distribution → roll → actor_events
            if (config('worldos.pulse.run_actor_decision', false)) {
                try {
                    $this->runActorDecisionForUniverse($universe, $snapshot, $rng);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Actor decision failed: ' . $e->getMessage());
                }
            }
            if (config('worldos.idea_diffusion.run_on_pulse', false)) {
                try {
                    $this->ideaDiffusionEngine->process($universe, (int) $snapshot->tick);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Idea diffusion failed: ' . $e->getMessage());
                }
            }
            if (config('worldos.institution.run_decay_on_pulse', false)) {
                try {
                    $this->institutionDecayService->process($universe, (int) $snapshot->tick);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Institution decay failed: ' . $e->getMessage());
                }
            }

            // 7. Detect & Dispatch Anomalies
            $this->detectAnomalies($universe, $snapshot);

            // 8. World Edicts (Governance)
            $this->worldEdictEngine->decree($universe, $snapshot);

            // 9. Great Filter, Ascension, Supreme Entities & Convergence (Handled by Institutions Module)
            $this->greatFilterEngine->process($universe, (int)$snapshot->tick, $snapshot->state_vector ?? [], $rng);
            $this->convergenceEngine->process($universe, (int)$snapshot->tick);
            $this->ascensionEngine->evaluate($universe, $snapshot);
            $this->omegaPointEngine->process($universe, $snapshot);

            // 9b. Ideology Evolution & Great Person (Phase K)
            if (config('worldos.pulse.run_ideology', true)) {
                try {
                    $ideologyResult = $this->ideologyEvolutionEngine->getDominantIdeology($universe);
                    if (! empty($ideologyResult['previous_dominant'])) {
                        $this->ideologyEvolutionEngine->recordShiftIfSignificant(
                            $universe,
                            (int) $snapshot->tick,
                            $ideologyResult['dominant'],
                            $ideologyResult['previous_dominant']
                        );
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Pulse: Ideology evolution failed: ' . $e->getMessage());
                }
            }
            if (config('worldos.pulse.run_great_person', true)) {
                try {
                    $this->greatPersonEngine->spawnIfEligible($universe, (int) $snapshot->tick);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Pulse: Great Person spawn failed: ' . $e->getMessage());
                }
            }
            if (config('worldos.pulse.run_great_person_legacy', true)) {
                try {
                    $this->greatPersonLegacyService->writeToStateVector($universe, (int) $snapshot->tick);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Pulse: Great Person legacy aggregate failed: ' . $e->getMessage());
                }
            }

        // 10. AI Narrative (Epistemic Instability)
        $this->createNarrativeChronicle($universe, $snapshot);

        // 11. Multiverse Interaction
        $this->multiverseInteractionService->detectResonance($universe);

        // 12. World Autonomic Regulation
        if ($universe->world) {
            $this->worldRegulatorEngine->process($universe->world);
        }

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Simulation evaluation failed in listener: " . $e->getMessage());
        }
    }

    protected function handleMerge($universe, array $decision): void
    {
        $candidateId = $decision['meta']['merge_candidate_universe_id'] ?? null;
        if ($candidateId === null || (int) $candidateId === (int) $universe->id) {
            return;
        }
        try {
            $this->timelineMergeAction->execute((int) $universe->id, (int) $candidateId);
            $this->universeRepository->update($universe->id, ['status' => 'archived']);
            $this->universeRepository->update((int) $candidateId, ['status' => 'archived']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("EvaluateSimulationResult: merge failed: " . $e->getMessage());
        }
    }

    protected function handlePromote($universe, array $decision): void
    {
        $this->universeRepository->update($universe->id, ['status' => 'promoted']);
    }

    protected function handleFork($universe, int $tick, array $decision): void
    {
        $saga = $this->sagaService->ensureSaga($universe);
        if (!$saga) {
            return;
        }

        $activeCount = \App\Models\Universe::where('saga_id', $saga->id)
            ->where('status', 'active')
            ->count();

        $childUniverses = $this->forkUniverseAction->execute($universe, $tick, $decision);

        if ($childUniverses->isNotEmpty() && $activeCount >= 1) {
            $this->universeRepository->update($universe->id, ['status' => 'halted']);
        }
    }

    protected function applySelectivePressure($universe, $snapshot, array $decisionData): void
    {
        if (!empty($decisionData['meta']['mutation_suggestion'])) {
            $suggestion = $decisionData['meta']['mutation_suggestion'];
            $vec = $universe->state_vector ?? [];
            if (empty($vec)) $vec = $snapshot->state_vector ?? [];
            
            $updated = false;

            if (isset($suggestion['suggest_reduce_entropy'])) {
                $vec['pressure_entropy_reduction'] = true;
                $updated = true;
            }

            if (isset($suggestion['add_scar'])) {
                $scars = $vec['scars'] ?? [];
                $newScar = $suggestion['add_scar'];
                if (!in_array($newScar, $scars)) {
                    $scars[] = $newScar;
                    $vec['scars'] = $scars;
                    $updated = true;
                }
            }

            if ($updated) {
                 $this->universeRepository->update($universe->id, ['state_vector' => $vec]);
            }
        }
    }

    protected function storePressureMetrics($universe, $snapshot): void
    {
        $state = $snapshot->state_vector ?? [];
        // Đưa entropy/stability từ snapshot vào state để PressureCalculator dùng (fallback energy_level).
        if (!isset($state['entropy'])) {
            $state['entropy'] = $snapshot->entropy ?? 0;
        }
        if (!isset($state['stability_index'])) {
            $state['stability_index'] = $snapshot->stability_index ?? 0;
        }

        $stress = $this->pressureCalculator->calculateMaterialStress($state);
        $cosmic = $this->pressureCalculator->calculateCosmicMetrics($state);

        $calculated_metrics = [
            'material_stress' => $stress,
            'order' => $cosmic['order'],
            'energy_level' => $cosmic['energy_level'],
        ];
        // Merge: snapshot->metrics (cosmic impact from SupremeEntity) wins over calculated pressure.
        $metrics = array_replace_recursive($calculated_metrics, $snapshot->metrics ?? []);

        // Metrics invariant [0,1]: clamp when writing so downstream engines can trust values.
        $metrics = $this->clampMetricsToUnitInterval($metrics);
        if (isset($snapshot->entropy)) {
            $snapshot->entropy = max(0.0, min(1.0, (float) $snapshot->entropy));
        }

        // Cosmic phase (dominant axis + hysteresis)
        $metrics['cosmic_phase'] = $this->cosmicPhaseDetector->detect($snapshot, $metrics);

        // Snapshot ảo (chưa lưu DB): cập nhật metrics vào bản ghi snapshot mới nhất để dashboard có số liệu gần đúng.
        if (!$snapshot->exists) {
            $latest = \App\Models\UniverseSnapshot::where('universe_id', $universe->id)
                ->orderByDesc('tick')
                ->first();
            if ($latest) {
                $latest->metrics = array_merge($latest->metrics ?? [], $metrics);
                $latest->save();
            }
            return;
        }

        $snapshot->metrics = $metrics;
        $snapshot->save();
    }

    /**
     * Enforce metrics invariant [0,1] when writing. Clamp known scalar keys and ethos dimensions.
     */
    protected function clampMetricsToUnitInterval(array $metrics): array
    {
        $scalarKeys = ['material_stress', 'order', 'energy_level'];
        foreach ($scalarKeys as $key) {
            if (isset($metrics[$key])) {
                $metrics[$key] = max(0.0, min(1.0, (float) $metrics[$key]));
            }
        }
        if (isset($metrics['ethos']) && is_array($metrics['ethos'])) {
            foreach (['spirituality', 'openness', 'rationality', 'hardtech'] as $dim) {
                if (isset($metrics['ethos'][$dim])) {
                    $metrics['ethos'][$dim] = max(0.0, min(1.0, (float) $metrics['ethos'][$dim]));
                }
            }
        }
        return $metrics;
    }

    protected function detectAnomalies($universe, $snapshot): void
    {
        $entropy = (float) $snapshot->entropy;
        $stability = (float) $snapshot->stability_index;

        if ($entropy > 0.95) {
            event(new \App\Events\Simulation\AnomalyDetected($universe, [
                'title' => 'Cánh cửa Hư vô (Void Gate) Mở ra',
                'description' => 'Entropy đạt mức tới hạn ('.round($entropy*100, 2).'%). Cấu trúc thực tại đang tan biến.',
                'severity' => 'CRITICAL'
            ]));
        } elseif ($stability < 0.2) {
             event(new \App\Events\Simulation\AnomalyDetected($universe, [
                'title' => 'Sụp đổ Cấu trúc Xã hội',
                'description' => 'Chỉ số ổn định thấp kỷ lục ('.round($stability, 4).'). Các định chế đang tan rã.',
                'severity' => 'CRITICAL'
            ]));
        } elseif (($snapshot->metrics['material_stress'] ?? 0) > 0.8) {
             event(new \App\Events\Simulation\AnomalyDetected($universe, [
                'title' => 'Căng thẳng Vật chất Cực độ',
                'description' => 'Áp lực lên hạ tầng vượt ngưỡng an toàn. Nguy cơ ly khai diện rộng.',
                'severity' => 'WARN'
            ]));
        }
    }

    protected function createNarrativeChronicle($universe, $snapshot): void
    {
        $entropy = (float) $snapshot->entropy;
        $noise = $this->epistemicService->calculateNoise($universe, $entropy);

        // Narrative v2: fact-first — use Historical Fact for this tick when available
        $worldEventId = null;
        $historicalBlock = null;
        $fact = null;
        if (config('worldos.narrative_v2.enable_fact_first_chronicle', true)) {
            $fact = \App\Models\HistoricalFact::where('universe_id', $universe->id)
                ->where('tick', $snapshot->tick)
                ->latest()
                ->first();
            if ($fact !== null) {
                $worldEventId = $fact->world_event_id;
                $historicalBlock = [
                    'year' => $fact->year,
                    'tick' => $fact->tick,
                    'category' => $fact->category,
                    'metrics' => $fact->metrics_after ?? [],
                    'events' => $fact->facts ?? [],
                ];
            }
        }

        $interpretations = [];
        if (config('worldos.narrative_v2.enable_perspective_layer', true)) {
            $eventPayload = [
                'category' => $historicalBlock['category'] ?? 'pressure_update',
                'metrics' => $historicalBlock['metrics'] ?? $snapshot->metrics ?? [],
                'events' => $historicalBlock['events'] ?? [],
                'entropy' => $entropy,
                'stability_index' => (float) $snapshot->stability_index,
            ];
            foreach ($this->perspectiveEngine->interpret($eventPayload, []) as $interp) {
                $interpretations[] = $interp->toArray();
            }
        }

        // Distort snapshot data for AI perception
        $canonicalData = [
            'entropy' => $entropy,
            'stability_index' => (float) $snapshot->stability_index,
            'metrics' => $snapshot->metrics ?? [],
        ];
        $perceivedData = $this->epistemicService->distort($canonicalData, $noise);
        if ($historicalBlock !== null) {
            $perceivedData['historical_block'] = $historicalBlock;
        }

        // Compile mythic text (compiler uses historical_block in prompt when present)
        $narrative = $this->narrativeCompiler->compile($perceivedData, $noise);

        $rawPayload = [
            'action' => 'legacy_event',
            'description' => $narrative,
            'interpretations' => $interpretations,
        ];
        if ($historicalBlock !== null) {
            $rawPayload['historical_block'] = $historicalBlock;
        }

        $chronicle = \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'world_event_id' => $worldEventId,
            'from_tick' => $snapshot->tick,
            'to_tick' => $snapshot->tick,
            'type' => 'narrative',
            'raw_payload' => $rawPayload,
            'perceived_archive_snapshot' => [
                'noise_level' => $noise,
                'clarity' => $this->epistemicService->getClarityLabel($noise),
                'perceived_state' => $perceivedData,
            ],
        ]);

        if (config('worldos.narrative_v2.enable_memory_graph', true) && $fact !== null) {
            try {
                $this->narrativeMemoryGraph->linkChronicleToFact($chronicle, $fact);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('NarrativeMemoryGraph linkChronicleToFact failed: ' . $e->getMessage());
            }
        }

        // Schedule LLM narrative via queue (no sync LLM call)
        $this->narrativeScheduler->scheduleEventForChronicle($universe->id, $chronicle->id);

        // Narrative 4-tier + Belief loop: interval-based jobs (era, religion spread, prophecy, legend)
        $this->runNarrativeIntervals($universe, (int) $snapshot->tick);
    }

    /**
     * Run narrative interval jobs: era (every era_interval), religion spread, prophecy, legend.
     */
    protected function runNarrativeIntervals(\App\Models\Universe $universe, int $tick): void
    {
        $eraInterval = (int) config('worldos.narrative.era_interval', 200);
        $religionInterval = (int) config('worldos.narrative.religion_interval', 200);
        $prophecyInterval = (int) config('worldos.narrative.prophecy_interval', 500);
        $legendInterval = (int) config('worldos.narrative.legend_interval', 100);

        if ($tick > 0 && $eraInterval > 0 && $tick % $eraInterval === 0) {
            try {
                $startTick = $tick - $eraInterval;
                $era = $this->eraDetector->detectAndCreate($universe, $startTick, $tick);
                if ($era !== null) {
                    $this->narrativeScheduler->scheduleEra($universe->id, $startTick, $tick, $era->id);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Narrative interval: Era detect/schedule failed: ' . $e->getMessage());
            }
        }

        if ($religionInterval > 0 && $tick % $religionInterval === 0) {
            try {
                $this->religionSpreadEngine->runForUniverse($universe, $tick);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Narrative interval: Religion spread failed: ' . $e->getMessage());
            }
        }

        if ($prophecyInterval > 0 && $tick % $prophecyInterval === 0) {
            try {
                $this->narrativeScheduler->scheduleProphecy($universe->id, $tick);
                $this->prophecyFulfillment->evaluateForUniverse($universe->id, $tick);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Narrative interval: Prophecy failed: ' . $e->getMessage());
            }
        }

        if ($legendInterval > 0 && $tick % $legendInterval === 0) {
            try {
                $agent = \App\Models\LegendaryAgent::where('universe_id', $universe->id)->inRandomOrder()->first();
                if ($agent !== null) {
                    $this->narrativeScheduler->scheduleLegend($universe->id, null, $agent->id);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Narrative interval: Legend failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Build belief context for ActorDecisionEngine: religion, prophecy belief, legend level.
     */
    protected function getBeliefContextForActor(\App\Models\Actor $actor): array
    {
        $hasReligion = $actor->religions()->exists();
        $hasProphecyBelief = $actor->prophecyBeliefs()->exists();
        $legendLevel = (int) $actor->legends()->max('legend_level');
        if ($legendLevel === 0 && $actor->supremeEntity) {
            $legendaryAgent = \App\Models\LegendaryAgent::where('original_agent_id', $actor->id)->first();
            if ($legendaryAgent) {
                $leg = \App\Models\Legend::where('legendary_agent_id', $legendaryAgent->id)->orderByDesc('legend_level')->first();
                $legendLevel = $leg ? (int) $leg->legend_level : 0;
            }
        }
        return [
            'has_religion' => $hasReligion,
            'has_prophecy_belief' => $hasProphecyBelief,
            'legend_level' => $legendLevel,
        ];
    }

    /**
     * Phase 2: Run CapabilityEngine + ActorDecisionEngine for key actors; record action in actor_events.
     */
    protected function runActorDecisionForUniverse($universe, $snapshot, \App\Simulation\Support\SimulationRandom $rng): void
    {
        $maxActors = (int) config('worldos.actor_decision.max_actors_per_pulse', 50);

        $keyActors = \App\Models\Actor::query()
            ->where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->whereHas('supremeEntity')
            ->orderByDesc('id')
            ->limit($maxActors)
            ->get();

        $tick = (int) $snapshot->tick;
        $state = (array) ($snapshot->state_vector ?? []);
        $metrics = (array) ($snapshot->metrics ?? []);
        $environment = [
            'entropy' => $snapshot->entropy ?? 0.5,
            'stability_index' => $snapshot->stability_index ?? 0.5,
            'war_pressure' => $state['war_pressure'] ?? 0,
        ];

        foreach ($keyActors as $actor) {
            $this->capabilityEngine->computeAndStore($actor, $tick);
            $actor->refresh();
            $capabilities = $actor->capabilities ?? [];
            $traits = $actor->traits ?? array_fill(0, 17, 0.5);
            $birthTick = (int) ($actor->birth_tick ?? $tick);
            $belief = $this->getBeliefContextForActor($actor);
            $environment['belief'] = $belief;
            $dist = $this->actorDecisionEngine->getActionDistribution($traits, $capabilities, $environment, $tick, $birthTick);
            $action = $this->actorDecisionEngine->rollAction($dist, $rng);
            \App\Models\ActorEvent::create([
                'actor_id' => $actor->id,
                'tick' => $tick,
                'event_type' => $action,
                'context' => ['distribution' => $dist, 'rolled' => $action],
            ]);
            if ($this->actorDecisionEngine->isArtifactEligibleAction($action)) {
                $this->artifactCreationEngine->tryCreate($actor, $universe, $tick, $action, $rng);
            }
        }
    }
}
