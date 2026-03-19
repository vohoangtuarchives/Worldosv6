<?php

namespace App\Simulation\Runtime;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\State\StateManager;
use App\Simulation\Runtime\Causality\ImpactReport;
use Illuminate\Support\Facades\Log;

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

        foreach ($this->orchestrationMap as $phase => $categories) {
            $phaseStart = microtime(true);
            $this->executePhase($phase, $categories, $state, $tick);
            $phaseMs = round((microtime(true) - $phaseStart) * 1000, 2);
            Log::debug("WorldKernel: Phase [{$phase}] completed in {$phaseMs}ms");
        }

        // 1. Process Global Emergence: State Transition Engine (ISTE)
        $iste = app(\App\Simulation\Runtime\Engines\StateTransitionEngine::class);
        $iste->run($state, $this->tickImpacts, $tick);

        // 2. Finalize: Link semantic impacts to the Causal History Engine
        $this->processCausalImpacts($state, $tick);

        // 3. Event-Driven: Dispatch domain events dựa trên ngưỡng state
        $this->dispatchDomainEvents($state, $tick);

        // 4. Narrative-Driven: Process Emergent Narrative Feedback & Scars (§Level-10)
        $this->finalizeNarrativeEmergence($state, $tick);

        $totalMs = round((microtime(true) - $startTime) * 1000, 2);
        Log::debug("WorldKernel: Orchestration Tick $tick Completed in {$totalMs}ms");
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
            event(new \App\Simulation\Events\StabilityCompromised(
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
                // systems now only receive the context for their specific phase
                $report = $system->update($context, $tick);
                
                if ($report && $report->hasImpacts()) {
                    $this->tickImpacts[] = $report;
                    
                    // V81: Apply scalar mutations reported by systems (e.g. Entropy changes)
                    foreach ($report->links as $link) {
                        if (isset($link->metadata['mutation'])) {
                            foreach ($link->metadata['mutation'] as $key => $value) {
                                $state->set($key, $value);
                            }
                        }
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
        $divergenceEngine = app(\App\Simulation\Runtime\Engines\DivergenceEngine::class);
        $canonLinks = $divergenceEngine->collapse($allLinks, $state);

        $causalEngine = app(\App\Simulation\Engines\Meta\CausalHistoryEngine::class);
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
     * Finalize Narrative Emergence: Bridge Simulation Results with Narrative Intent.
     */
    public function finalizeNarrativeEmergence(WorldState $state, int $tick): void
    {
        $universeId = (int) $state->get('universe_id', 0);
        
        // 1. Fetch pending narrative feedback signals and Universe axioms
        $universe = \App\Models\Universe::find($universeId);
        $signals = \App\Modules\Narrative\Models\NarrativeFeedbackSignal::pendingForTick($universeId, $tick)->get();
        
        $influences = $signals->map(fn($s) => $s->payload)->toArray();
        if ($universe && !empty($universe->axioms)) {
            $influences[] = [
                'type' => 'ruleset_axioms',
                'payload' => $universe->axioms
            ];
        }

        // 2. Synchronize ActorEntities into Zones (Rust Agent structures)
        echo "DEBUG: Calling syncActorsToZones...\n";
        $this->syncActorsToZones($state);
        
        // 3. Call Rust Emergent Tick
        /** @var \App\Modules\Simulation\Services\FfiActorEngine $ffi */
        $ffi = app(\App\Modules\Simulation\Services\FfiActorEngine::class);
        try {
            $data = $state->toArray();
            $data['universe_id'] = $universeId;
            $data['tick'] = (int)$tick;
            $data['global_entropy'] = (float)$state->get('entropy', 0.5);
            $data['knowledge_core'] = (float)$state->get('knowledge_core', 0.0);
            $data['zones'] = $state->getZones();
            
            $result = $ffi->tickUniverseEmergent($data, $influences, $tick);
            
            // 3. Update State from Rust (Macro-level changes)
            if (isset($result['state'])) {
                foreach ($result['state'] as $key => $value) {
                    if (is_scalar($value) || is_array($value)) {
                        $state->set($key, $value);
                    }
                }
                
                // 4. Sync agents back from zones to entities
                $this->syncZonesToActors($state);
            }

            // 4. Record Scars (Events) and Tags
            if (!empty($result['scars'])) {
                foreach ($result['scars'] as $scar) {
                    // Record as Chronicle or Narrative Event
                    \App\Models\Chronicle::create([
                        'universe_id' => $universeId,
                        'from_tick' => $tick,
                        'to_tick' => $tick,
                        'type' => $scar['type'] ?? 'EMERGENT_SCAR',
                        'content' => $scar['description'] ?? 'Unnamed emergent event',
                        'importance' => 0.7,
                        'raw_payload' => $scar
                    ]);
                }
            }

            // Mark signals as applied
            $signals->each(fn($s) => $s->update(['status' => 'applied']));

        } catch (\Exception $e) {
            Log::error("WorldKernel: Narrative Emergence failed: " . $e->getMessage());
        }
    }

    protected function syncActorsToZones(WorldState $state): void
    {
        $actorsByZone = [];
        foreach ($state->getActorEntities() as $actor) {
            // Map ActorEntity to Rust-compatible Agent structure
            $zoneId = (int)data_get($actor->metrics, 'zone_id', 0);
            // Archetype mapping (Vietnamese -> Rust Enum)
            $archetype = strtolower($actor->archetype);
            $mappedArchetype = match(true) {
                str_contains($archetype, 'chiến binh') || str_contains($archetype, 'lãnh đạo') || str_contains($archetype, 'hộ vệ') || str_contains($archetype, 'tà tu') || str_contains($archetype, 'kiếm sĩ') => 'Warlord',
                str_contains($archetype, 'tín đồ') || str_contains($archetype, 'tu sĩ') || str_contains($archetype, 'tu chân') => 'Zealot',
                str_contains($archetype, 'kẻ cơ hội') || str_contains($archetype, 'thương nhân') || str_contains($archetype, 'kẻ phá bĩnh') => 'Opportunist',
                str_contains($archetype, 'học giả') || str_contains($archetype, 'kỹ sư') || str_contains($archetype, 'hành giả') || str_contains($archetype, 'hacker') => 'Sage',
                default => 'Commoner',
            };

            // Trait vector slicing (Rust Core expects 17 dimensions)
            $traits = array_values($actor->traits);
            $traitVector = array_slice(array_map('floatval', $traits), 0, 17);

            $actorsByZone[$zoneId][] = [
                'id' => (int)$actor->id,
                'trait_vector' => $traitVector,
                'archetype' => $mappedArchetype,
                'memory' => [], // Rust-side memory is transient/short-term
                'vocation_id' => $actor->vocationId,
                'motivation_profile' => $actor->metrics['motivation_profile'] ?? [
                    'creation' => 0.0, 'destruction' => 0.0, 'order' => 0.0, 'chaos' => 0.0,
                    'self_preservation' => 0.0, 'altruism' => 0.0, 'physical' => 0.0, 'metaphysical' => 0.0
                ]
            ];
        }

        $zones = $state->getZones();
        foreach ($zones as &$zone) {
            $id = (int)$zone['id'];
            $zone['state']['agents'] = $actorsByZone[$id] ?? [];
        }
        $state->setZones($zones);
    }

    protected function syncZonesToActors(WorldState $state): void
    {
        $entities = $state->getActorEntities();
        $zones = $state->getZones();
        $agentsById = [];

        foreach ($zones as $zone) {
            foreach ($zone['state']['agents'] ?? [] as $agent) {
                $agentsById[(int)$agent['id']] = $agent;
            }
        }

        foreach ($entities as $entity) {
            if ($entity->id && isset($agentsById[$entity->id])) {
                $agent = $agentsById[$entity->id];
                // Update vocation and motivation from Rust result
                $entity->vocationId = $agent['vocation_id'] ?? $entity->vocationId;
                $entity->metrics['motivation_profile'] = $agent['motivation_profile'] ?? ($entity->metrics['motivation_profile'] ?? null);
                
                // Also update traits if they drifted (though core uses trait_vector index)
                if (isset($agent['trait_vector'])) {
                    $entity->traits = $agent['trait_vector'];
                }
            }
        }
    }
}

