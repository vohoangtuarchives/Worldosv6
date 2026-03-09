<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ApplyMythScarAction;
use App\Actions\Simulation\RunMicroModeAction;
use App\Actions\Simulation\ForkUniverseAction;
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
        protected \App\Modules\Simulation\Services\GreatPersonEngine $greatPersonEngine
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

            // 6. Strategic Actions (Fork/Archive/Mutate) — AEE decisions
            if ($action === 'fork') {
                $this->handleFork($universe, (int)$snapshot->tick, $decisionData);
            } elseif ($action === 'continue' || $action === 'mutate') {
                $this->applySelectivePressure($universe, $snapshot, $decisionData);
            } elseif ($action === 'archive') {
                $this->universeRepository->update($universe->id, ['status' => 'archived']);
            }

            // 6. Calculate & Store Pressure Metrics
            $this->storePressureMetrics($universe, $snapshot);

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

        $metrics = $snapshot->metrics ?? [];
        $metrics['material_stress'] = $stress;
        $metrics['order'] = $cosmic['order'];
        $metrics['energy_level'] = $cosmic['energy_level'];

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
        $entropy = (float)$snapshot->entropy;
        $noise = $this->epistemicService->calculateNoise($universe, $entropy);
        
        // Distort snapshot data for AI perception
        $canonicalData = [
            'entropy' => $entropy,
            'stability_index' => (float)$snapshot->stability_index,
            'metrics' => $snapshot->metrics ?? []
        ];
        
        $perceivedData = $this->epistemicService->distort($canonicalData, $noise);
        
        // Compile mythic text
        $narrative = $this->narrativeCompiler->compile($perceivedData, $noise);
        
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $snapshot->tick,
            'to_tick' => $snapshot->tick,
            'type' => 'narrative',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => $narrative
            ],
            'perceived_archive_snapshot' => [
                'noise_level' => $noise,
                'clarity' => $this->epistemicService->getClarityLabel($noise),
                'perceived_state' => $perceivedData
            ]
        ]);
    }
}
