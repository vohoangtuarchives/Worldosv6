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
     * Advance universe by N ticks. Calls engine (stub or gRPC), then persists snapshot.
     */
    public function advance(int $universeId, int $ticks): array
    {
        $universe = Universe::findOrFail($universeId);

        if ($universe->status === 'halted') {
            return ['ok' => false, 'error' => 'Universe is halted'];
        }

        $stateInput = '';
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        
        // Reconstruct UniverseState structure for Rust Engine
        $zones = [];
        $globalEntropy = 0.0;
        $knowledgeCore = 0.0;
        $scars = [];

        // Check if $vec has new structure (zones key) or old flat structure
        if (isset($vec['zones'])) {
            $zones = $vec['zones'];
            $globalEntropy = $vec['global_entropy'] ?? ($vec['entropy'] ?? 0.0);
            $knowledgeCore = $vec['knowledge_core'] ?? 0.0;
            $scars = $vec['scars'] ?? [];
        } else {
            // Flat structure or mixed
            // Try to extract zones: assume numeric keys or '0' key are zones
            foreach ($vec as $k => $v) {
                if (is_numeric($k) && is_array($v) && isset($v['id'])) {
                    $zones[] = $v;
                }
            }
            // If no zones found, maybe vec itself is list of zones?
            if (empty($zones) && isset($vec[0]['id'])) {
                $zones = $vec;
            }
            
            $globalEntropy = $vec['entropy'] ?? 0.0;
            $scars = $vec['scars'] ?? [];
        }

        if (!empty($zones) || !empty($vec)) {
            // Even if zones empty, we might want to send other state params if Engine supports it
            // But Engine requires UniverseState structure
            // Fetch Institutional Entities to sync with Engine
            $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universe->id)
                ->whereNull('collapsed_at_tick')
                ->get();

            $stateObj = [
                'universe_id' => $universe->id,
                'tick' => $universe->current_tick,
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
            $stateInput = json_encode($stateObj);
        }

        $response = $this->engine->advance($universeId, $ticks, $stateInput);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshot = $response['snapshot'] ?? [];
        if (! empty($snapshot)) {
            $stateVector = is_string($snapshot['state_vector'] ?? null)
                ? json_decode($snapshot['state_vector'], true) ?? []
                : ($snapshot['state_vector'] ?? []);
            $metrics = is_string($snapshot['metrics'] ?? null)
                ? json_decode($snapshot['metrics'], true) ?? []
                : ($snapshot['metrics'] ?? []);
            
            // Sync active crises from persistent state
            $metrics['active_crises'] = $universe->state_vector['active_crises'] ?? [];
            
            // Phase 24: World-Will Alignment
            if ($this->worldWill) {
                $metrics['alignment'] = $this->worldWill->calculateAlignment($universe);
            }

            $saved = $this->snapshots->save($universe, [
                'tick' => $snapshot['tick'],
                'state_vector' => $stateVector,
                'entropy' => $snapshot['entropy'] ?? null,
                'stability_index' => $snapshot['stability_index'] ?? null,
                'metrics' => $metrics,
            ]);

            if ($this->materialLifecycle !== null) {
                $context = $this->buildMaterialContext($snapshot, $stateVector, $metrics);
                $deltas = $this->materialLifecycle->processTick($universeId, (int) $snapshot['tick'], $context);
                
                if (!empty($deltas)) {
                    $vec = $universe->state_vector ?? [];
                    $vec['entropy'] = ($vec['entropy'] ?? 0) + ($deltas['entropy'] ?? 0);
                    $vec['stability_index'] = ($vec['stability_index'] ?? 0) + ($deltas['order'] ?? 0);
                    $vec['innovation'] = ($vec['innovation'] ?? 0) + ($deltas['innovation'] ?? 0);
                    $vec['growth'] = ($vec['growth'] ?? 0) + ($deltas['growth'] ?? 0);
                    $vec['trauma'] = ($vec['trauma'] ?? 0) + ($deltas['trauma'] ?? 0);

                    // Clamp
                    $vec['entropy'] = max(0.0, min(1.0, (float)$vec['entropy']));
                    $vec['stability_index'] = max(0.0, min(1.0, (float)$vec['stability_index']));
                    
                    $universe->update(['state_vector' => $vec]);
                }
            }

            if ($this->cultureDiffusion !== null) {
                $this->cultureDiffusion->apply($universe);
            }

            if ($this->institutionalEngine) {
                if (isset($this->evolutionAction)) {
                    $this->institutionalEngine->setEvolutionAction($this->evolutionAction);
                }
                $this->institutionalEngine->process($universe, (int)$snapshot['tick'], $metrics);
            }

            if ($this->multiverseInteraction) {
                $this->multiverseInteraction->detectResonance($universe);
            }

            if ($this->autonomyEngine) {
                $this->autonomyEngine->process($universe, (int)$snapshot['tick']);
            }

            if ($this->greatFilter) {
                $this->greatFilter->process($universe, (int)$snapshot['tick'], $stateVector);
            }

            if ($this->ascensionAction) {
                $this->ascensionAction->execute($universe, (int)$snapshot['tick']);
            }

            if ($this->celestialEngineering) {
                $this->celestialEngineering->execute($universe, (int)$snapshot['tick'], $metrics);
            }

            if ($this->convergenceEngine) {
                $this->convergenceEngine->process($universe, (int)$snapshot['tick']);
            }

            if ($this->narrativeAi !== null) {
                $fromTick = (int) $universe->current_tick;
                $toTick = (int) $snapshot['tick'];
                if ($toTick > $fromTick) {
                    try {
                        $this->narrativeAi->generateChronicle($universeId, $fromTick, $toTick, 'chronicle');
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::error("Narrative generation failed: " . $e->getMessage());
                    }
                }
            }

            try {
                $decisionData = app(DecisionEngine::class)->decide($saved);
                $action = $decisionData['action'] ?? 'continue';

                if ($action === 'fork') {
                    $exists = BranchEvent::where('universe_id', $universe->id)
                        ->where('from_tick', (int) $saved->tick)
                        ->where('event_type', 'fork')
                        ->exists();
                    if (! $exists) {
                        $payload = [
                            'reason' => $decisionData['meta']['reason'] ?? 'high_entropy',
                            'mutation' => $decisionData['meta']['mutation_suggestion'] ?? null,
                            'score' => $decisionData['meta']['ip_score'] ?? 0,
                        ];
                        BranchEvent::create([
                            'universe_id' => $universe->id,
                            'from_tick' => (int) $saved->tick,
                            'event_type' => 'fork',
                            'payload' => $payload,
                        ]);
                        app(SagaService::class)->spawnUniverse(
                            $universe->world,
                            $universe->id,
                            $universe->saga_id,
                            $payload
                        );
                        // Optional: Mark current universe as forked-source or similar if needed
                        // For now we keep it active but maybe reduce its entropy?
                        // Let's reduce entropy significantly to represent "pressure release"
                        $vec = $universe->state_vector ?? [];
                        $vec['entropy'] = 0.5; // Reset to manageable level
                        $universe->update(['state_vector' => $vec]);
                        
                        // IMPORTANT: Update local snapshot/saved variable to reflect this change if needed downstream
                        // But actually we are done for this tick.
                    }
                } elseif ($action === 'continue') {
                    // Always check mutation suggestion even if just continue
                    if (!empty($decisionData['meta']['mutation_suggestion'])) {
                        // Apply Selective Pressure (soft mutation without forking)
                        $suggestion = $decisionData['meta']['mutation_suggestion'];
                        $vec = $universe->state_vector ?? [];
                        if (empty($vec)) $vec = $saved->state_vector ?? []; // Fallback to snapshot vector if universe vector is empty
                        
                        $updated = false;

                        if (isset($suggestion['suggest_reduce_entropy'])) {
                            // Apply pressure to reduce entropy in next tick
                            $vec['pressure_entropy_reduction'] = true;
                            $updated = true;
                        }

                        if (isset($suggestion['add_scar'])) {
                            // Inflict Scar
                            $scars = $vec['scars'] ?? [];
                            $newScar = $suggestion['add_scar'];
                            if (!in_array($newScar, $scars)) {
                                $scars[] = $newScar;
                                $vec['scars'] = $scars;
                                $updated = true;
                            }
                        }

                        if ($updated) {
                            $universe->update(['state_vector' => $vec]);
                            // Ensure next snapshot picks up this change or we rely on next tick
                        }
                    }
                } elseif ($action === 'archive') {
                    $universe->update(['status' => 'archived']);
                }
            } catch (\Throwable $e) {
                // ignore decision failures but log if needed
            }
        }

        if (! empty($snapshot) && isset($snapshot['tick'])) {
            $universe->update(['current_tick' => $snapshot['tick']]);
        }

        return $response;
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
