<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ApplyMythScarAction;
use App\Actions\Simulation\RunMicroModeAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Repositories\UniverseRepository;
use Illuminate\Contracts\Queue\ShouldQueue;

class EvaluateSimulationResult
{
    public function __construct(
        protected DecideUniverseAction $decideUniverseAction,
        protected ApplyMythScarAction $applyMythScarAction,
        protected RunMicroModeAction $runMicroModeAction,
        protected ForkUniverseAction $forkUniverseAction,
        protected UniverseRepository $universeRepository,
        protected \App\Services\Simulation\HeroicActorService $heroicService,
        protected \App\Services\Simulation\PressureCalculator $pressureCalculator,
        protected \App\Services\Simulation\GreatFilterEngine $greatFilterEngine,
        protected \App\Services\Simulation\AscensionEngine $ascensionEngine,
        protected \App\Services\Simulation\SupremeEntityEngine $supremeEntityEngine,
        protected \App\Services\Simulation\ConvergenceEngine $convergenceEngine,
        protected \App\Services\Simulation\WorldEdictEngine $worldEdictEngine,
        protected \App\Services\Simulation\OmegaPointEngine $omegaPointEngine,
        protected \App\Services\Simulation\CivilizationEngine $civilizationEngine,
        protected \App\Services\Simulation\DiplomacyEngine $diplomacyEngine,
        protected \App\Services\Simulation\ZoneConflictEngine $zoneConflictEngine,
        protected \App\Services\Simulation\VoidExplorationEngine $voidExplorationEngine,
        protected \App\Services\Simulation\EpochEngine $epochEngine,
        protected \App\Services\Simulation\CausalCorrectionEngine $causalCorrectionEngine,
        protected \App\Services\Simulation\ResonanceEngine $resonanceEngine,
        protected \App\Services\Simulation\ObservationInterferenceEngine $observationInterferenceEngine,
        protected \App\Services\Simulation\TrajectoryModelingEngine $trajectoryModelingEngine,
        protected \App\Services\AI\EpistemicService $epistemicService,
        protected \App\Services\AI\NarrativeCompiler $narrativeCompiler
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;

        try {
            // 1. Actors Lifecycle (Heroic Service)
            $this->heroicService->spawnFromEvents($universe, (int)$snapshot->tick);
            $this->heroicService->evolve($universe, (int)$snapshot->tick);

            // 2. Strategic Decision
            $decisionData = $this->decideUniverseAction->execute($snapshot);
            $action = $decisionData['action'] ?? 'continue';

            // 3. Apply Myth Scars
            $this->applyMythScarAction->execute($universe, $snapshot, $decisionData);

            // 4. Run Micro Mode
            $this->runMicroModeAction->execute($universe, $snapshot, $decisionData);

            // 5. Emerging Civilizations (Multi-Civilization Dynamics)
            $this->civilizationEngine->process($universe, $snapshot);
            $this->diplomacyEngine->process($universe, $snapshot);
            $this->zoneConflictEngine->resolveConflicts($universe, $snapshot);
            $this->voidExplorationEngine->explore($universe, $snapshot);
            $this->convergenceEngine->process($universe, $snapshot);
            $this->causalCorrectionEngine->process($universe, $snapshot);
            $this->resonanceEngine->process($universe, $snapshot);
            $this->observationInterferenceEngine->process($universe, $snapshot);
            $this->trajectoryModelingEngine->process($universe, $snapshot);

            // 6. Strategic Actions (Fork/Archive)
            if ($action === 'fork') {
                $this->handleFork($universe, (int)$snapshot->tick, $decisionData);
            } elseif ($action === 'continue') {
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

            // 9. Great Filter, Ascension, Supreme Entities & Convergence (Cosmic Layer)
            $this->greatFilterEngine->process($universe, (int)$snapshot->tick, $snapshot->state_vector ?? []);
            $this->supremeEntityEngine->process($universe, $snapshot);
            $this->convergenceEngine->process($universe, (int)$snapshot->tick);
            $this->ascensionEngine->evaluate($universe, $snapshot);
            $this->omegaPointEngine->process($universe, $snapshot);

            // 10. AI Narrative (Epistemic Instability)
            $this->createNarrativeChronicle($universe, $snapshot);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Simulation evaluation failed in listener: " . $e->getMessage());
        }
    }

    protected function handleFork($universe, int $tick, array $decision): void
    {
        $saga = $universe->saga;
        if (!$saga) return;

        // Branch Concurrency Limit Logic from AutonomicDecisionEngine
        $activeCount = \App\Models\Universe::where('saga_id', $saga->id)
            ->where('status', 'active')
            ->count();

        $childUniverse = $this->forkUniverseAction->execute($universe, $tick, $decision);

        if ($childUniverse && $activeCount >= 1) { // Default branch limit = 1
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
        $stress = $this->pressureCalculator->calculateMaterialStress($state);
        
        $metrics = $snapshot->metrics ?? [];
        $metrics['material_stress'] = $stress;
        
        // Calculate Cosmic Metrics (Order, Energy Level)
        $cosmic = $this->pressureCalculator->calculateCosmicMetrics($state);
        $metrics['order'] = $cosmic['order'];
        $metrics['energy_level'] = $cosmic['energy_level'];
        
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
        } elseif ($snapshot->metrics['material_stress'] > 0.8) {
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
            'content' => $narrative,
            'perceived_archive_snapshot' => [
                'noise_level' => $noise,
                'clarity' => $this->epistemicService->getClarityLabel($noise),
                'perceived_state' => $perceivedData
            ]
        ]);
    }
}
