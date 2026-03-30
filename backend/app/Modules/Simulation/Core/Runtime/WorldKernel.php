<?php

namespace App\Modules\Simulation\Core\Runtime;

use App\Modules\Simulation\Core\Runtime\Contracts\WorldSystemInterface;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Runtime\State\StateManager;
use App\Modules\Simulation\Core\Runtime\Causality\ImpactReport;
use App\Modules\Psychology\ValueObjects\TraitVector;
use App\Modules\Psychology\Dsl\BehaviorDslLoader;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * WorldKernel – The core of WorldOS simulation (§World-Kernel).
 * 
 * "Laravel backend chỉ đóng vai orchestrator"
 * Orchestrates all 15 Primitive Rules across 5 Reality Phases.
 */
class WorldKernel
{
    // --- 5 PHASES OF REALITY ---
    public const PHASE_ENVIRONMENT = 'environment';
    public const PHASE_LIFE        = 'life';
    public const PHASE_MIND        = 'mind';
    public const PHASE_SOCIAL      = 'social';
    public const PHASE_META        = 'meta';

    // --- 15 PRIMITIVE RULE CATEGORIES ---
    public const RULE_METABOLISM   = 'metabolism';
    public const RULE_EXTRACTION   = 'extraction';
    public const RULE_INNOVATION   = 'innovation';
    public const RULE_DIFFUSION    = 'diffusion';
    public const RULE_COHESION     = 'cohesion';
    public const RULE_ENTROPY      = 'entropy';
    public const RULE_CONFLICT     = 'conflict';
    public const RULE_PROPAGATION  = 'propagation';
    public const RULE_RECURSION    = 'recursion';
    public const RULE_ASCENSION    = 'ascension';
    public const RULE_CORRECTION   = 'correction';
    public const RULE_OBSERVATION  = 'observation';
    public const RULE_BRIDGE       = 'bridge';
    public const RULE_NARRATIVE    = 'narrative';
    public const RULE_CYCLE        = 'cycle';
    public const RULE_ATTRACTION   = 'attraction';

    /** @var array<string, array<string, object[]>> */
    protected array $orchestrationMap = [];

    /** @var ImpactReport[] */
    protected array $tickImpacts = [];

    public function __construct(
        protected StateManager $stateManager
    ) {
        $this->initOrchestrationMap();
    }

    protected function initOrchestrationMap(): void
    {
        foreach ([self::PHASE_ENVIRONMENT, self::PHASE_LIFE, self::PHASE_MIND, self::PHASE_SOCIAL, self::PHASE_META] as $phase) {
            $this->orchestrationMap[$phase] = [];
        }
    }

    public function registerSystem(string $phase, string $category, object $system): void
    {
        $this->orchestrationMap[$phase][$category][] = $system;
    }

    /**
     * Run the full simulation orchestration for a single tick.
     */
    public function execute(WorldState $state, int $tick): void
    {
        $startTime = microtime(true);
        Log::debug("WorldKernel: Starting Orchestration Tick $tick");
        $this->tickImpacts = [];

        // 1. PHASE 0: Agents Act First (§V8 Realignment)
        // V9: Ensure zones are prepopulated with agents from the single source of truth
        $state->syncAgentsToZones();
        
        // Before world environment updates, agents must decide and act.
        $this->executeAgentActions($state, $tick);

        // V9: Resync after actions (to reflect movement/changes before systems run)
        $state->syncAgentsToZones();

        // 2. PHASE 1-5: Sequential Reality Phases
        foreach ($this->orchestrationMap as $phase => $categories) {
            $phaseStart = microtime(true);
            $this->executePhase($phase, $categories, $state, $tick);
            $phaseMs = round((microtime(true) - $phaseStart) * 1000, 2);
            Log::debug("WorldKernel: Phase [{$phase}] completed in {$phaseMs}ms");
        }

        // 3. Process Global Emergence: State Transition Engine (ISTE)
        $iste = app(\App\Modules\Simulation\Core\Runtime\Engines\StateTransitionEngine::class);
        $iste->run($state, $this->tickImpacts, $tick);

        // 4. Finalize: Link semantic impacts to the Causal History Engine
        $this->processCausalImpacts($state, $tick);

        // 5. Narrative-Driven: Cleanup & Feedback
        $this->finalizeTick($state, $tick);

        $totalMs = round((microtime(true) - $startTime) * 1000, 2);
        Log::debug("WorldKernel: Orchestration Tick $tick Completed in {$totalMs}ms");
    }

    protected function executeAgentActions(WorldState $state, int $tick): void
    {
        $universeId = (int) $state->get('universe_id', 0);
        $actors = $state->getActorEntities();
        if (empty($actors)) return;

        // V8: Historical Scars from previous ticks provide path-dependence
        $pastScars = $state->getScars();

        // shard and process (same logic as old finalizeNarrativeEmergence but at START)
        $universe = \App\Models\Universe::find($universeId);
        $isObserved = (float) ($universe->observation_load ?? 0.0) > 0.5;
        
        $factionRelations = \App\Models\FactionRelation::all()->toArray();
        $beliefDefinitions = \App\Models\Belief::all()->map(function($b) {
            return ['id' => $b->id, 'name' => $b->name, 'type' => $b->type, 'trait_weights' => $b->trait_weights];
        })->toArray();
        
        $techDefinitions = \App\Models\Technology::all()->map(function($t) {
            return ['id' => $t->id, 'name' => $t->name, 'code' => $t->code, 'requirements' => $t->requirements, 'effects' => $t->effects];
        })->toArray();

        // Sharding if needed
        $shardCount = config('worldos.simulation.shard_count', 1);
        $actorBatches = array_chunk($actors, ceil(count($actors) / $shardCount));

        foreach ($actorBatches as $batchIdx => $batchActors) {
            $this->processAgentBatch($universeId, $tick, $batchActors, $state, $isObserved, $factionRelations, $beliefDefinitions, $techDefinitions, $pastScars);
        }
    }

    protected function finalizeTick(WorldState $state, int $tick): void
    {
        // Periodic Decay of Memory to prevent state bloat
        if ($tick % 50 === 0) {
            app(\App\Modules\Simulation\Actions\DecayScarsAction::class)->handle((int)$state->get('universe_id'));
        }
        
        // Dispatch Domain Events
        $this->dispatchDomainEvents($state, $tick);
    }

    /**
     * Dispatch domain events dựa trên ngưỡng state.
     */
    protected function dispatchDomainEvents(WorldState $state, int $tick): void
    {
        $entropy = $state->get('entropy', 0.0);
        $stability = $state->get('stability_index', 1.0);
        $universeId = (int) $state->get('universe_id', 0);

        // Dispatch StabilityCompromised khi entropy > 0.8 hoặc stability < 0.2
        if ($entropy > 0.8 || $stability < 0.2) {
            event(new \App\Modules\Simulation\Core\Events\StabilityCompromised(
                universeId: $universeId,
                tick: $tick,
                entropy: (float) $entropy,
                stabilityIndex: (float) $stability,
                reason: $entropy > 0.8 ? 'high_entropy' : 'low_stability',
            ));
        }
    }

    protected function executePhase(string $phase, array $categories, WorldState $state, int $tick): void
    {
        // Enforce Strict Layered Isolation (§Phase 4 Architectures)
        // We capture the specific layer context before executing systems
        $context = $this->preparePhaseContext($phase, $state);

        foreach ($categories as $category => $systems) {
            foreach ($systems as $system) {
                $systemClass = get_class($system);
                if ($system instanceof \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter) {
                    // Try to get the underlying engine class if possible
                    $ref = new \ReflectionClass($system);
                    $prop = $ref->getProperty('engine');
                    $prop->setAccessible(true);
                    $systemClass .= " (" . get_class($prop->getValue($system)) . ")";
                }
                
                Log::debug("WorldKernel: Executing Phase [{$phase}], Category [{$category}], System [{$systemClass}]");
                
                // systems now only receive the context for their specific phase
                $report = $system->update($context, $tick);
                
                if ($report && $report->hasImpacts()) {
                    $this->tickImpacts[] = $report;
                    
                    // V81: Apply scalar mutations reported by systems (e.g. Entropy changes)
                    $hasMutation = false;
                    foreach ($report->links as $link) {
                        if (isset($link->metadata['mutation'])) {
                            foreach ($link->metadata['mutation'] as $key => $value) {
                                $state->set($key, $value);
                                $hasMutation = true;
                            }
                        }
                    }

                    // Re-prepare context if state was mutated so next systems see the changes
                    if ($hasMutation) {
                        $context = $this->preparePhaseContext($phase, $state);
                    }
                }
            }
        }

        $this->finalizePhase($phase, $state);
    }

    protected function processCausalImpacts(WorldState $state, int $tick): void
    {
        if (empty($this->tickImpacts)) return;

        $allLinks = [];
        foreach ($this->tickImpacts as $report) {
            foreach ($report->links as $link) {
                $allLinks[] = $link;
            }
        }

        // V81 Quantum Branching: Collapse divergence into canon history
        $divergenceEngine = app(\App\Modules\Simulation\Core\Runtime\Engines\DivergenceEngine::class);
        $canonLinks = $divergenceEngine->collapse($allLinks, $state);

        $causalEngine = app(\App\Modules\Simulation\Core\Engines\Meta\CausalHistoryEngine::class);
        foreach ($canonLinks as $link) {
            $causalEngine->recordLink($link, $tick);
        }
    }

    protected function preparePhaseContext(string $phase, WorldState $state): ?array
    {
        // Use the Multi-Layer Mapping from WorldState to provide clean context to engines
        return match ($phase) {
            self::PHASE_ENVIRONMENT => $state->getPhysicalLayer(),
            self::PHASE_LIFE        => $state->getLifeLayer(),
            self::PHASE_SOCIAL      => $state->getSocialLayer(),
            self::PHASE_MIND        => $state->getNarrativeLayer(),
            self::PHASE_META        => $state->getMythicLayer(),
            default => null
        };
    }

    protected function finalizePhase(string $phase, WorldState $state): void
    {
        // Optional: Perform cross-layer leakage or stabilization logic
    }

    /**
     * Process a single batch of actors (Shard) via gRPC.
     */
    private function processAgentBatch(int $universeId, int $tick, array $actors, WorldState $state, bool $isObserved = false, array $factionRelations = [], array $beliefDefinitions = [], array $techDefinitions = [], array $pastScars = []): void
    {
        $ids = [];
        $zoneIds = [];
        $hunger = [];
        $energy = [];
        $fear = [];
        $trauma = [];
        $heroicTypes = [];
        $lineageIds = [];
        $memes = [];
        $traitsMatrix = [];
        $behaviorStates = [];
        $archetypes = [];
        $factionIdsList = [];
        $factionLoyaltyList = [];
        $beliefAlignments = [];
        $actorTechLevels = [];

        foreach ($actors as $actor) {
            $ids[] = (int) $actor->id;
            $zoneIds[] = (int) $actor->zone_id;
            $hunger[] = (float) $actor->hunger;
            $energy[] = (float) $actor->energy;
            $fear[]   = (float) $actor->fear;
            $trauma[] = (float) $actor->trauma;
            
            $heroicTypes[] = $this->mapArchetypeToTypeId($actor->archetype);
            $lineageIds[]  = (int) data_get($actor->metrics, 'lineage_id', 0);
            $memes[] = (int) data_get($actor->metrics, 'meme_mask', 0);
            
            $archetypes[] = $actor->archetype ?? 'Commoner';
            $behaviorStates[] = (int) data_get($actor->metrics, 'behavior_state', 0);

            // Collect belief alignments (Phase 13)
            $actorBeliefs = DB::table('actor_beliefs')
                ->where('actor_id', $actor->id)
                ->pluck('alignment', 'belief_id')
                ->toArray();
            
            foreach ($beliefDefinitions as $def) {
                $beliefAlignments[] = (float) ($actorBeliefs[$def['id']] ?? 0.0);
            }

            // Collect technology levels (Phase 14)
            $actorTechs = DB::table('actor_technologies')
                ->where('actor_id', $actor->id)
                ->pluck('level', 'technology_id')
                ->toArray();
            
            foreach ($techDefinitions as $def) {
                $actorTechLevels[] = (float) ($actorTechs[$def['id']] ?? 0.0);
            }

            $factionsCollection = is_array($actor->factions) ? collect($actor->factions) : $actor->factions;
            $primaryFaction = $factionsCollection->first();
            $factionIdsList[] = $primaryFaction ? (int) ($primaryFaction->id ?? $primaryFaction['id'] ?? 0) : 0;
            $factionLoyaltyList[] = $primaryFaction ? (float) ($primaryFaction->pivot->loyalty ?? $primaryFaction['loyalty'] ?? 0.5) : 0.5;

            $actorTraitsValues = null;
            if ($actor->traits instanceof \App\Modules\Psychology\ValueObjects\TraitVector) {
                $actorTraitsValues = $actor->traits->all();
            } elseif (is_array($actor->traits) && count($actor->traits) === 17) {
                $actorTraitsValues = $actor->traits;
            } else {
                $metricTraits = data_get($actor->metrics, 'trait_vector');
                if (is_array($metricTraits) && count($metricTraits) === 17) {
                    $actorTraitsValues = $metricTraits;
                }
            }

            if ($actorTraitsValues) {
                foreach ($actorTraitsValues as $val) {
                    $traitsMatrix[] = (float) $val;
                }
            } else {
                for ($i = 0; $i < 17; $i++) {
                    $traitsMatrix[] = 0.5;
                }
            }
        }

        $behaviorGraphs = $this->buildBehaviorGraphs();
        $socialGraph = $this->collectSocialGraph($actors);
        $edicts = $this->collectActiveEdicts($universeId);

        /** @var \App\Contracts\SimulationEngineClientInterface $client */
        $client = app(\App\Contracts\SimulationEngineClientInterface::class);
        
        try {
            $sagaBuilder = app(\App\Modules\Simulation\Services\Narrative\SagaBuilderService::class);
            $activeSagas = $sagaBuilder->buildActiveSagas($universeId, $tick);

            $result = $client->processActorsSoa(
                tick: $tick,
                ids: $ids,
                zoneIds: $zoneIds,
                hunger: $hunger,
                energy: $energy,
                fear: $fear,
                trauma: $trauma,
                heroicTypes: $heroicTypes,
                lineageIds: $lineageIds,
                memes: $memes,
                traitsMatrix: $traitsMatrix,
                behaviorStates: $behaviorStates,
                behaviorGraphs: $behaviorGraphs,
                archetypes: $archetypes,
                socialGraph: $socialGraph,
                edicts: $edicts,
                factionIds: $factionIdsList,
                factionLoyalty: $factionLoyaltyList,
                isObserved: (bool) $isObserved,
                narrativeContext: $activeSagas,
                factionRelations: $factionRelations,
                beliefDefinitions: $beliefDefinitions,
                beliefAlignments: $beliefAlignments,
                techDefinitions: $techDefinitions,
                actorTechLevels: $actorTechLevels
            );

            // 4. Update State from Rust (Macro-level changes)
            if (isset($result['ok']) && $result['ok']) {
                $this->applySoaUpdatesToActors($actors, $result['outputs'] ?? []);
                
                // Update behavior states
                if (!empty($result['behavior_states'])) {
                    foreach ($actors as $idx => $actor) {
                        if (isset($result['behavior_states'][$idx])) {
                            $metrics = $actor->metrics;
                            $metrics['behavior_state'] = $result['behavior_states'][$idx];
                            $actor->metrics = $metrics;
                            // Note: save is usually called in applySoaUpdatesToActors or later
                        }
                    }
                }
                
                // 5. Record Scars (Events) + V10: Event → Field Mutation
                if (!empty($result['scars'])) {
                    $entropyDelta = 0.0;
                    $violenceDelta = 0.0;

                    // V10: Scars must mutate state fields (close the feedback loop)
                    // We apply deltas for ALL events to ensure physical feedback, 
                    // but we only RECORD significant ones as history.
                    foreach ($result['scars'] as $scar) {
                        $category = strtoupper($scar['category'] ?? '');
                        match (true) {
                            str_contains($category, 'STARV') => ($entropyDelta += 0.005),
                            (str_contains($category, 'REVOLT') || str_contains($category, 'WAR')) => ($entropyDelta += 0.01 + ($violenceDelta += 0.015)),
                            (str_contains($category, 'DISASTER') || str_contains($category, 'DEATH')) => ($entropyDelta += 0.003),
                            default => null
                        };
                    }

                    // V10: Narrative Layer Distillation & SCAR Persistence (§V8 Fix)
                    $this->persistAndDistillScars($state, $tick, $result['scars'], $universeId);
                }

                // Phase 4: Handle Civilization Metrics
                if (!empty($result['civilization_metrics'])) {
                    $this->storeCivilizationMetrics($universeId, $tick, $result['civilization_metrics']);
                }

                // Phase 15: Handle Emergent Calamities
                if (!empty($result['calamities'])) {
                    foreach ($result['calamities'] as $calamity) {
                        \App\Models\Chronicle::create([
                            'universe_id' => $universeId,
                            'actor_id' => null,
                            'from_tick' => $tick,
                            'to_tick' => $tick,
                            'type' => 'GLOBAL_CALAMITY',
                            'content' => $calamity['description'] ?? 'A great calamity strikes.',
                            'importance' => 1.0,
                            'raw_payload' => $calamity
                        ]);
                    }
                }

                // Phase 13/14 Updates
                if (!empty($result['outputs'])) {
                    $this->applyBeliefAndTechUpdates($actors, $result['outputs'], $beliefDefinitions, $techDefinitions);
                }

                // Births
                if (!empty($result['spawned_actors'])) {
                    $this->handleSpawnedActors($universeId, $tick, $result['spawned_actors']);
                }
            }
        } catch (\Exception $e) {
            Log::error("WorldKernel: gRPC Shard processing failed: " . $e->getMessage());
        }
    }
    private function applyBeliefAndTechUpdates(array $actors, array $outputs, array $beliefDefinitions, array $techDefinitions): void
    {
        foreach ($outputs as $idx => $out) {
            if (!isset($actors[$idx])) continue;
            $actorId = $actors[$idx]->id;

            // Phase 13: Beliefs
            if (isset($out['new_belief_alignments'])) {
                foreach ($beliefDefinitions as $bIdx => $def) {
                    $alignment = $out['new_belief_alignments'][$bIdx] ?? 0.0;
                    DB::table('actor_beliefs')->updateOrInsert(
                        ['actor_id' => $actorId, 'belief_id' => $def['id']],
                        ['alignment' => $alignment, 'updated_at' => now()]
                    );
                }
            }

            // Phase 14: Technology
            if (isset($out['new_tech_levels'])) {
                foreach ($techDefinitions as $tIdx => $def) {
                    $newLevel = $out['new_tech_levels'][$tIdx] ?? 0.0;
                    if ($newLevel > 0) {
                        DB::table('actor_technologies')->updateOrInsert(
                            ['actor_id' => $actorId, 'technology_id' => $def['id']],
                            ['level' => $newLevel, 'updated_at' => now()]
                        );
                    }
                }
            }
        }
    }

    private function handleSpawnedActors(int $universeId, int $tick, array $spawnedActors): void
    {
        foreach ($spawnedActors as $spawn) {
            $parentId = $spawn['parent_id'];
            $parent = \App\Models\Actor::find($parentId);
            $generation = $parent ? $parent->generation + 1 : 1;
            
            $child = \App\Models\Actor::create([
                'universe_id' => $universeId,
                'name' => "Descendant of " . ($parent ? $parent->name : $parentId),
                'archetype' => $spawn['archetype'] ?? 'Commoner',
                'parent_actor_id' => $parentId,
                'birth_tick' => $tick,
                'is_alive' => true,
                'traits' => $spawn['trait_vector'] ?? [],
                'metrics' => [
                    'zone_id' => $spawn['zone_id'],
                    'hunger' => 0.1,
                    'energy' => 0.6,
                    'fear' => 0.0,
                    'trauma' => 0.0,
                ],
                'generation' => $generation,
            ]);
            event(new \App\Modules\Simulation\Core\Events\ActorBornEvent($universeId, (int)$tick, [
                'child_id' => $child->id,
                'parent1_id' => $parentId,
                'traits' => $spawn['trait_vector'] ?? []
            ]));
        }
    }

    private function persistAndDistillScars(WorldState $state, int $tick, array $scars, int $universeId): void
    {
        // 1. Persist in WorldState for engine memory (path-dependence)
        $currentScars = $state->getScars();
        $updatedScars = array_merge($currentScars, $scars);
        
        // Cap scans to avoid bloat (last 50 significant scars)
        if (count($updatedScars) > 50) {
            $updatedScars = array_slice($updatedScars, -50);
        }
        $state->setScars($updatedScars);

        // 2. Distill for Narrative Chronicles (Historical record)
        app(\App\Modules\Simulation\Actions\DistillScarsAction::class)->handle($universeId, $tick, $scars);

        // 3. Field feedback loop
        $entropyDelta = 0.0;
        $violenceDelta = 0.0;
        foreach ($scars as $scar) {
            $category = strtoupper($scar['category'] ?? '');
            if (str_contains($category, 'DEATH')) $entropyDelta += 0.001;
            if (str_contains($category, 'WAR')) {
                $entropyDelta += 0.01;
                $violenceDelta += 0.015;
            }
        }
        
        if ($entropyDelta > 0) {
            $state->updateField('entropy', min(0.05, $entropyDelta), 'Scar-driven feedback');
        }
        if ($violenceDelta > 0) {
            $state->updateField('violence', min(0.05, $violenceDelta), 'Scar-driven violence');
        }
    }

    private function mapArchetypeToTypeId(?string $archetype): int
    {
        $archetype = strtolower($archetype);
        return match(true) {
            str_contains($archetype, 'chiến binh') || str_contains($archetype, 'lãnh đạo') => 1, // Warlord
            str_contains($archetype, 'tín đồ') || str_contains($archetype, 'tu sĩ') => 2,      // Zealot
            str_contains($archetype, 'kẻ cơ hội') || str_contains($archetype, 'thương nhân') => 3, // Opportunist
            str_contains($archetype, 'học giả') || str_contains($archetype, 'kỹ sư') => 4,     // Sage
            default => 0, // Commoner
        };
    }

    private function applySoaUpdatesToActors(array $actors, array $outputs): void
    {
        if (empty($outputs)) return;
        
        $actorMap = [];
        foreach ($actors as $a) {
            $actorMap[$a->id] = $a;
        }

        $skipAttributeSync = config('worldos.event_stream.kafka_enabled', false);

        foreach ($outputs as $out) {
            $actorId = $out['actor_id'] ?? 0;
            if (isset($actorMap[$actorId])) {
                $agent = $actorMap[$actorId];
                
                // If Kafka is enabled, we skip attribute sync here to reduce blocking time,
                // as those will be handled asynchronously by the Kafka consumer.
                if (!$skipAttributeSync) {
                    $metrics = $agent->metrics; 
                    
                    if (isset($out['new_hunger'])) {
                        $metrics['hunger'] = $out['new_hunger'];
                    }
                    if (isset($out['new_energy'])) {
                        $metrics['energy'] = $out['new_energy'];
                    }
                    if (isset($out['new_trauma'])) {
                        $metrics['trauma'] = $out['new_trauma'];
                    }
                    $agent->metrics = $metrics;

                    // Phase 5: Deep Memory - Persistent Trait Mutation
                    if (!empty($out['new_traits'])) {
                        $agent->traits = $out['new_traits'];
                    }

                    // Phase 8: Faction Sync
                    if (!empty($out['new_faction_ids'])) {
                        $factionId = $out['new_faction_ids'][0];
                        $loyalty = $out['new_faction_loyalty'][0] ?? 0.5;
                        
                        if ($factionId > 0) {
                            $agent->factions()->sync([
                                $factionId => ['loyalty' => $loyalty]
                            ]);
                        }
                    }

                    $agent->save();
                }
            }
        }
    }

    /**
     * Map behavior name from DSL to Rust action type string.
     */
    private function mapToRustActionType(string $behaviorName): string
    {
        return match (strtolower($behaviorName)) {
            'withdraw' => 'Flee',
            'cooperate' => 'Socialize',
            'resist' => 'Conflict',
            'forage' => 'Forage',
            'breed' => 'Breed',
            default => 'Idle',
        };
    }

    /**
     * Build BehaviorGraph Protobuf objects from DSL.
     * 
     * @return \Worldos\Simulation\BehaviorGraph[]
     */
    private function buildBehaviorGraphs(): array
    {
        /** @var BehaviorDslLoader $loader */
        $loader = app(BehaviorDslLoader::class);
        $dsl = $loader->load();
        
        $graph = new \Worldos\Simulation\BehaviorGraph();
        $graph->setArchetype("Commoner");

        $nodes = [];
        $behaviors = $dsl['behaviors'] ?? [];
        foreach ($behaviors as $idx => $b) {
            $node = new \Worldos\Simulation\BehaviorNode();
            $node->setId($idx);
            $node->setName($b['name'] ?? 'unknown');
            $node->setActionType($this->mapToRustActionType($b['name'] ?? ''));
            $nodes[] = $node;
        }
        $graph->setNodes($nodes);

        // Basic V7 Transitions (Hardcoded for now as DSL is flat)
        $transitions = [];
        // [0: withdraw, 1: resist, 2: cooperate, 3: isolate, 4: passive]
        // 4 is 'passive' (Idle) in current behaviors.json
        // Corrected V12 Transitions:conditions must be valid boolean expressions
        $transitions[] = $this->createTransition(4, 0, "fear > 0.6", 1.0);
        $transitions[] = $this->createTransition(4, 2, "trust > 0.6", 0.8);
        $transitions[] = $this->createTransition(4, 1, "anger > 0.7", 0.5);
        $transitions[] = $this->createTransition(0, 4, "fear < 0.2", 1.0);
        
        $graph->setTransitions($transitions);

        return [$graph];
    }

    private function createTransition(int $from, int $to, string $cond, float $weight): \Worldos\Simulation\BehaviorTransition
    {
        $t = new \Worldos\Simulation\BehaviorTransition();
        $t->setFromNodeId($from);
        $t->setToNodeId($to);
        $t->setCondition($cond);
        $t->setWeight($weight);
        return $t;
    }

    /**
     * Collect social edges from actors' metrics.
     */
    private function collectSocialGraph(array $actors): array
    {
        $edges = [];
        foreach ($actors as $actor) {
            $relations = data_get($actor->metrics, 'social_relations', []);
            foreach ($relations as $targetId => $relData) {
                // We simplify trust/fear into a single weight for initial contagion
                $weight = ($relData['trust'] ?? 0.0) + ($relData['fear'] ?? 0.0) * 0.5;
                $edges[] = [
                    'source_id' => (int) $actor->id,
                    'target_id' => (int) $targetId,
                    'weight'    => (float) $weight
                ];
            }
        }
        return $edges;
    }

    /**
     * Collect active edicts for the universe.
     */
    private function collectActiveEdicts(int $universeId): array
    {
        // Placeholder: Implementation would normally query an Edicts table
        // For V7 demo, we enable "Pax WorldOS" and "Great Enlightenment"
        return [
            [
                'name' => 'Pax WorldOS',
                'modifier_type' => 'trauma_gain',
                'value' => 0.7 // 30% reduction in trauma gain globally
            ],
            [
                'name' => 'Great Enlightenment',
                'modifier_type' => 'energy_delta',
                'value' => 1.2 // 20% boost in energy efficiency/recovery
            ]
        ];
    }

    /**
     * Store civilization-level metrics for historical analysis.
     */
    private function storeCivilizationMetrics(int $universeId, int $tick, array $metrics): void
    {
        Log::info("Civilization Aggregator [Tick $tick]:", [
            'universe_id' => $universeId,
            'entropy' => $metrics['global_entropy'],
            'zone_count' => count($metrics['zone_stats']),
        ]);

        // In a real production system, we would save to a UniverseMetrics table
        // For V7 demo, we'll emit a system event that can be picked up by the UI
        event(new \App\Modules\Simulation\Events\CivilizationMetricsUpdated($universeId, $tick, $metrics));
    }
}




