<?php

namespace App\Modules\Simulation\Core\Runtime\State;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\World\Entities\ResourceEntity;
use App\Modules\Intelligence\Entities\IdeaEntity;
use Illuminate\Support\Facades\Log;

/**
 * StateManager – Manages the lifecycle of WorldState during a tick.
 * 
 * Ensures state is loaded once, modified by engines, and saved once.
 */
class StateManager
{
    public function __construct(
        protected \App\Modules\Intelligence\Contracts\ActorRepositoryInterface $actorRepository,
        protected \App\Modules\Institutions\Contracts\InstitutionalRepositoryInterface $institutionalRepository,
        protected \App\Modules\Intelligence\Services\EcosystemMetricsService $ecosystemMetrics,
        protected \App\Modules\Narrative\Services\OmenIntegrationService $omenService,
        protected \App\Contracts\UniverseSimilarityServiceInterface $similarityService,
        protected \App\Modules\Simulation\Services\HolographicCompressionService $compressionService
    ) {}

    protected array $originalData = [];
    protected ?WorldState $currentState = null;

    public function load(Universe $universe, ?UniverseSnapshot $snapshot = null): WorldState
    {
        $data = (array) ($universe->state_vector ?? []);
        
        // Phase 70: Decompress holographic state if detected
        if (isset($data['_hologram'])) {
            Log::debug("StateManager: Holographic compression detected during load.");
        }

        $this->originalData = $data;

        // Phase 42: Load real-time ecosystem metrics into state
        $data['ecosystem_metrics'] = $this->ecosystemMetrics->forUniverse($universe);
        
        // Phase 11: Sync tech_level from Universe level (int -> float 0.0-1.0 mapping)
        $data['tech_level'] = (float)($universe->level ?? 1) / 10.0;

        $this->currentState = new WorldState($data);
        
        // Load active actors into the state pooled collection
        $entities = $this->actorRepository->findActiveByUniverse($universe->id);
        $this->currentState->setActorEntities($entities);

        // Phase 46: Load active institutions into the state pooled collection
        $institutions = $this->institutionalRepository->findActiveByUniverse($universe->id);
        $this->currentState->setInstitutionalEntities($institutions);

        // Phase 80: Load Resources and Ideas from state_vector (§World-Kernel)
        $resources = array_map(fn($r) => ResourceEntity::fromArray($r), $data['resources'] ?? []);
        $this->currentState->setResourceEntities($resources);
        $ideas = array_map(fn($i) => IdeaEntity::fromArray($i), $data['ideas'] ?? []);
        $this->currentState->setIdeaEntities($ideas);

        // Phase 47: Load historical weight (recent chronicles)
        $chronicles = \App\Models\Chronicle::where('universe_id', $universe->id)
            ->orderByDesc('to_tick')
            ->limit(10)
            ->get()
            ->all();
        $this->currentState->setRecentChronicles($chronicles);

        // Phase 47: Fetch and store Reality Omen
        $omen = $this->omenService->getCurrentOmen($universe);
        $this->currentState->set('meta.omen', [
            'type' => $omen['type'],
            'sci_modifier' => (float)$omen['sci_modifier'],
            'entropy_modifier' => (float)$omen['entropy_modifier'],
            'description' => $omen['description']
        ]);

        // Phase 48: Load Supreme Entities (Causal Overlords)
        $supremes = \App\Models\SupremeEntity::where('universe_id', $universe->id)->get()->all();
        $this->currentState->setSupremeEntities($supremes);

        // Phase 49: Quantum Observer State
        $this->currentState->set('meta.observation_load', (float)($universe->observation_load ?? 0.0));
        $isObserved = $universe->last_observed_at && 
                      $universe->last_observed_at->diffInSeconds(\Illuminate\Support\Carbon::now()) < 30;
        $this->currentState->setIsObserved($isObserved);
        
        // Phase 56: Neighboring Realities Pool (Reality Bleeding)
        if ($snapshot) {
            $neighbors = $this->similarityService->getNeighbors($snapshot, 0.6); // 60% similarity threshold for resonance
            $this->currentState->setNeighboringRealities($neighbors);
        }

        return $this->currentState;
    }

    public function save(Universe $universe): void
    {
        if (!$this->currentState) {
            return;
        }

        $data = $this->currentState->toArray();
        unset($data['_snapshot_metrics']); 
        unset($data['ecosystem_metrics']); // Keep state_vector clean of derived metrics

        // Phase 80: Persist Resources and Ideas back to state_vector (§World-Kernel)
        $data['resources'] = array_map(fn($r) => $r->toArray(), $this->currentState->getResourceEntities());
        $data['ideas'] = array_map(fn($i) => $i->toArray(), $this->currentState->getIdeaEntities());

        // Phase 70: Apply Holographic Compression (Delta-Encoding)
        // Bypassed for stability: saving full data to state_vector
        $universe->state_vector = $data;
        $universe->save();

        // Save batch of pooled actors: alive actors updated, dead actors DELETED
        $allActors = $this->currentState->getActorEntities();
        $aliveActors = array_filter($allActors, fn($a) => $a->isAlive);
        $deadActors = array_filter($allActors, fn($a) => !$a->isAlive);

        // Persist alive actors
        $this->actorRepository->saveBatch(array_values($aliveActors));

        // V10: Actually delete dead actors from DB to enforce selection pressure
        foreach ($deadActors as $dead) {
            if ($dead->id) {
                $this->actorRepository->delete((int) $dead->id);
                Log::info("StateManager: Actor {$dead->name} ({$dead->id}) permanently removed from simulation.");
            }
        }

        // Phase 46: Save pooled institutions
        foreach ($this->currentState->getInstitutionalEntities() as $inst) {
            $this->institutionalRepository->save($inst);
        }
        
        Log::debug("StateManager: Universe state, actors and institutions batch-saved", [
            'universe_id' => $universe->id,
        ]);
    }

    public function get(): ?WorldState
    {
        return $this->currentState;
    }

    /**
     * Clear an actor from current state collections to force reload from DB.
     * (Phase 9: Distributed Consistency)
     */
    public function forgetActor(int|string $actorId): void
    {
        if ($this->currentState) {
            $this->currentState->forgetActor((int) $actorId);
        }
    }
}


