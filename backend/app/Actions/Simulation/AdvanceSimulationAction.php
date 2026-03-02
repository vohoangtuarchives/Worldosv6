<?php

namespace App\Actions\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Contracts\SimulationEngineClientInterface;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Material\MaterialLifecycleEngine;
use App\Services\Narrative\NarrativeAiService;

use App\Services\Simulation\CultureDiffusionService;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Services\Simulation\GenreBifurcationEngine;
use App\Services\Simulation\SupremeEntityEngine;
use App\Services\Simulation\ZoneConflictEngine;
use App\Services\Simulation\WorldEdictEngine;
use App\Services\Simulation\AscensionEngine;

use App\Services\Simulation\InstitutionalEngine;

class AdvanceSimulationAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected SimulationEngineClientInterface $engine,
        protected UniverseSnapshotRepository $snapshots,
        protected DecideUniverseAction $decideUniverseAction,
        protected ForkUniverseAction $forkUniverseAction,
        protected ApplyMythScarAction $applyMythScarAction,
        protected RunMicroModeAction $runMicroModeAction,
        protected ?MaterialLifecycleEngine $materialLifecycle = null,
        protected ?NarrativeAiService $narrativeAi = null,
        protected ?GenreBifurcationEngine $genreEngine = null,
        protected ?SupremeEntityEngine $supremeEngine = null,
        protected ?ZoneConflictEngine $conflictEngine = null,
        protected ?WorldEdictEngine $edictEngine = null,
        protected ?AscensionEngine $ascensionEngine = null,
        protected ?CultureDiffusionService $cultureDiffusion = null,
        protected ?InstitutionalEngine $institutionalEngine = null
    ) {}

    public function execute(int $universeId, int $ticks): array
    {
        $universe = $this->universeRepository->find($universeId);

        if (!$universe || $universe->status === 'halted') {
            return ['ok' => false, 'error' => 'Universe not found or is halted'];
        }

        $stateInput = $this->prepareEngineStateInput($universe);
        $response = $this->engine->advance($universeId, $ticks, $stateInput);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshot = $response['snapshot'] ?? [];
        if (! empty($snapshot)) {
            $savedSnapshot = $this->saveSnapshot($universe, $snapshot);

            // 1. Process Material Lifecycle 
            if ($this->materialLifecycle !== null) {
                $context = $this->buildMaterialContext($snapshot, $savedSnapshot->state_vector ?? [], $savedSnapshot->metrics ?? []);
                $deltas = $this->materialLifecycle->processTick($universeId, (int) $snapshot['tick'], $context);
                
                if (!empty($deltas)) {
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
            }

            if ($this->cultureDiffusion !== null) {
                $this->cultureDiffusion->apply($universe);
            }

            if ($this->institutionalEngine !== null) {
                $this->institutionalEngine->process($universe, (int)$snapshot['tick'], $savedSnapshot->metrics ?? []);
            }

            // 2. Narrative Ai 
            if ($this->narrativeAi !== null) {
                $fromTick = (int) $universe->current_tick;
                $toTick = (int) $snapshot['tick'];
                if ($toTick > $fromTick) {
                    try {
                        $this->narrativeAi->generateChronicle($universeId, $fromTick, $toTick, 'chronicle');
                    } catch (\Throwable $e) {}
                }
            }

            // 3. Dynamic Genre Bifurcation
            if ($this->genreEngine !== null) {
                try {
                    $this->genreEngine->evaluateAndShift($universe, $savedSnapshot);
                } catch (\Throwable $e) {}
            }

            // 3.5. Supreme Entity Impact (Must run after snap update, or before genre bif?)
            // Actually before Genre Bifurcation is better so genre shifts based on affected metrics
            // We'll run it here.
            if ($this->supremeEngine !== null) {
                try {
                    $this->supremeEngine->process($universe, $savedSnapshot);
                } catch (\Throwable $e) {}
            }

            // 3.6. Geopolitical Conflicts (Zones invades each other based on metrics)
            if ($this->conflictEngine !== null) {
                try {
                    $this->conflictEngine->resolveConflicts($universe, $savedSnapshot);
                } catch (\Throwable $e) {}
            }

            // 3.7. World Edicts (Supreme entities passing laws)
            if ($this->edictEngine !== null) {
                try {
                    $this->edictEngine->decree($universe, $savedSnapshot);
                } catch (\Throwable $e) {}
            }

            // 3.8. Universal Ascension & Eschaton (Check for limits/reset)
            if ($this->ascensionEngine !== null) {
                try {
                    $this->ascensionEngine->evaluate($universe, $savedSnapshot);
                } catch (\Throwable $e) {}
            }

            // 4. Evaluation & Decision (Action Layer)
            try {
                $decisionData = $this->decideUniverseAction->execute($savedSnapshot);
                $action = $decisionData['action'] ?? 'continue';

                // Generate Myth Scars if stability drops or suggested by decision
                $this->applyMythScarAction->execute($universe, $savedSnapshot, $decisionData);

                // Run Micro Mode Agents to resolve prolonged instability and write to timeline
                $this->runMicroModeAction->execute($universe, $savedSnapshot, $decisionData);

                if ($action === 'fork') {
                     $this->forkUniverseAction->execute($universe, (int)$savedSnapshot->tick, $decisionData);
                } elseif ($action === 'continue') {
                     $this->applySelectivePressure($universe, $savedSnapshot, $decisionData);
                } elseif ($action === 'archive') {
                     $this->universeRepository->update($universe->id, ['status' => 'archived']);
                }
            } catch (\Throwable $e) {}
        }

        if (! empty($snapshot) && isset($snapshot['tick'])) {
            $this->universeRepository->update($universe->id, ['current_tick' => $snapshot['tick']]);
        }

        return $response;
    }

    private function saveSnapshot($universe, array $snapshot)
    {
         $stateVector = is_string($snapshot['state_vector'] ?? null)
            ? json_decode($snapshot['state_vector'], true) ?? []
            : ($snapshot['state_vector'] ?? []);
            
        $metrics = is_string($snapshot['metrics'] ?? null)
            ? json_decode($snapshot['metrics'], true) ?? []
            : ($snapshot['metrics'] ?? []);
            
        return $this->snapshots->save($universe, [
            'tick' => $snapshot['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshot['entropy'] ?? null,
            'stability_index' => $snapshot['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
    }

    private function prepareEngineStateInput($universe): string
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $zones = [];
        $globalEntropy = 0.0;
        $knowledgeCore = 0.0;
        $scars = [];

        if (isset($vec['zones'])) {
            $zones = $vec['zones'];
            $globalEntropy = $vec['global_entropy'] ?? ($vec['entropy'] ?? 0.0);
            $knowledgeCore = $vec['knowledge_core'] ?? 0.0;
            $scars = $vec['scars'] ?? [];
        } else {
            foreach ($vec as $k => $v) {
                if (is_numeric($k) && is_array($v) && isset($v['id'])) {
                    $zones[] = $v;
                }
            }
            if (empty($zones) && isset($vec[0]['id'])) {
                $zones = $vec;
            }
            $globalEntropy = $vec['entropy'] ?? 0.0;
            $scars = $vec['scars'] ?? [];
        }

        // Fetch Institutional Entities for sync
        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $stateObj = [
            'universe_id' => $universe->id,
            'tick' => (int)$universe->current_tick,
            'zones' => $zones,
            'global_entropy' => (float)$globalEntropy,
            'knowledge_core' => (float)$knowledgeCore,
            'scars' => $scars,
            'institutions' => $institutions->map(fn($e) => [
                'id' => $e->id,
                'type' => $e->entity_type,
                'capacity' => $e->org_capacity,
                'ideology' => $e->ideology_vector,
                'legitimacy' => $e->legitimacy,
                'influence' => $e->influence_map,
            ])->toArray(),
        ];

        return json_encode($stateObj);
    }

    private function applySelectivePressure($universe, $savedSnapshot, array $decisionData): void
    {
        if (!empty($decisionData['meta']['mutation_suggestion'])) {
            $suggestion = $decisionData['meta']['mutation_suggestion'];
            $vec = $universe->state_vector ?? [];
            if (empty($vec)) $vec = $savedSnapshot->state_vector ?? [];
            
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

    private function buildMaterialContext(array $snapshot, array $stateVector, array $metrics): array
    {
        $entropy = $snapshot['entropy'] ?? 0;
        $stability = $snapshot['stability_index'] ?? 0;
        
        $scars = [];
        if (isset($stateVector['scars']) && is_array($stateVector['scars'])) {
            $scars = $stateVector['scars'];
        }

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
