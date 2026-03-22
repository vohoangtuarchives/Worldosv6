<?php

namespace App\Modules\Simulation\Core\Runtime\State;

/**
 * WorldState – A structured wrapper for the Universe state_vector.
 * 
 * Provides a standardized contract for all ~100 engines.
 */
class WorldState
{
    /** @var \App\Modules\Intelligence\Entities\ActorEntity[] */
    protected array $actorEntities = [];

    /** @var \App\Modules\Institutions\Entities\InstitutionalEntity[] */
    protected array $institutionalEntities = [];
    
    /** @var \App\Modules\World\Entities\ResourceEntity[] */
    protected array $resourceEntities = [];

    /** @var \App\Modules\Intelligence\Entities\IdeaEntity[] */
    protected array $ideaEntities = [];

    /** @var \App\Modules\Narrative\Models\Chronicle[] */
    protected array $recentChronicles = [];

    /** @var \App\Modules\Intelligence\Models\SupremeEntity[] */
    protected array $supremeEntities = [];

    /** @var bool */
    protected bool $isObserved = false;

    public function __construct(
        protected array $data = [],
        public array $neighboring_realities = [],
        public array $legacy_data = [],
        public array $hyperspace_vector = [],
        public array $nested_realities = []
    ) {}

    public static function fromArray(array $data): self
    {
        return new self($data);
    }

    public function toArray(): array
    {
        return $this->data;
    }

    // --- COSMIC LAYER ---
    public function getCosmic(): array { return $this->data['cosmic'] ?? []; }
    public function setCosmic(array $val): void { $this->data['cosmic'] = $val; }

    // --- PLANETARY LAYER ---
    public function getPlanetary(): array { return $this->data['planetary'] ?? []; }
    public function setPlanetary(array $val): void { $this->data['planetary'] = $val; }

    // --- ECOSYSTEM LAYER ---
    public function getEcosystem(): array { return $this->data['ecosystem'] ?? []; }
    public function setEcosystem(array $val): void { $this->data['ecosystem'] = $val; }

    // --- ACTOR LAYER ---
    public function getActors(): array { return $this->data['actors'] ?? []; }
    public function setActors(array $val): void { $this->data['actors'] = $val; }

    // --- CIVILIZATION LAYER ---
    public function getCivilization(): array { return $this->data['civilization'] ?? []; }
    public function setCivilization(array $val): void { $this->data['civilization'] = $val; }
    
    public function getFields(): array { return $this->data['fields'] ?? []; }
    public function setFields(array $val): void { $this->data['fields'] = $val; }

    /**
     * Step 3: Field & Layer Harmonization (§Field Simulation Architecture)
     * Maps existing CFT fields to the 4 Layers of Reality.
     */
    public function getPhysicalLayer(): array
    {
        $fields = $this->getFields();
        return [
            'state' => [
                'ecosystem' => $this->getEcosystem(),
                'planetary' => $this->getPlanetary(),
                'cosmic' => $this->getCosmic(),
                'resources' => $this->getResourceEntities(),
            ],
            'pressures' => [
                'survival_pressure' => (float)($fields['survival'] ?? 0.0),
                'resource_scarcity' => (float)(isset($fields['wealth']) ? (1 - $fields['wealth']) : 0.5),
                'natural_entropy' => (float)($fields['entropy'] ?? 0.0),
                'physical_fear' => (float)($fields['fear'] ?? 0.0),
            ]
        ];
    }

    public function getLifeLayer(): array
    {
        $fields = $this->getFields();
        return [
            'state' => [
                'actors' => $this->getActorEntities(),
                'zones' => $this->getZones(),
            ],
            'pressures' => [
                'metabolic_stress' => (float)($fields['survival'] ?? 0.0),
                'environmental_instability' => (float)($this->get('stability_index', 1.0)),
            ]
        ];
    }

    public function getSocialLayer(): array
    {
        $fields = $this->getFields();
        return [
            'state' => [
                'institutions' => $this->getInstitutionalEntities(),
                'civilizations' => $this->get('civilizations', []),
                'resources' => $this->getResourceEntities(), // Required by PowerSystem
                'actors' => $this->getActorEntities(), // Required by AllianceSystem
            ],
            'pressures' => [
                'war_pressure' => (float)($fields['power'] ?? 0.0),
                'authority_intensity' => (float)($fields['authority'] ?? 0.0),
                'social_order' => (float)($fields['order'] ?? 1.0),
            ]
        ];
    }

    public function getNarrativeLayer(): array
    {
        $fields = $this->getFields();
        return [
            'state' => [
                'ideas' => $this->getIdeaEntities(),
                'myths' => $this->get('meta.active_myths', []),
                'narratives' => $this->get('meta.active_narratives', []), // Added
                'chronicles' => $this->getRecentChronicles(),
            ],
            'pressures' => [
                'collective_meaning' => (float)($fields['meaning'] ?? 0.5),
                'knowledge_diffusion' => (float)($fields['knowledge'] ?? 0.0),
            ]
        ];
    }

    public function getMythicLayer(): array
    {
        $fields = $this->getFields();
        return [
            'state' => [
                'hyperspace' => $this->getHyperspaceVector(),
                'nested_realities' => $this->getNestedRealities(),
                'supreme_entities' => $this->getSupremeEntities(),
                'resources' => $this->getResourceEntities(), // Required by ConflictSystem
                'entropy' => $this->getEntropy(),
                'stability_index' => $this->getStabilityIndex(),
                'ideas' => $this->getIdeaEntities(), // Required by MythCreationSystem
            ],
            'pressures' => [
                'field_resonance' => (float)($fields['resonance'] ?? 0.0),
                'mandate_strength' => (float)($this->get('meta.mandate_of_heaven', 0.5)),
            ]
        ];
    }

    public function getZones(): array { return $this->data['zones'] ?? []; }
    public function setZones(array $val): void { $this->data['zones'] = $val; }

    public function getZoneMemory(int $zoneId): array { return $this->get("memory.zones.{$zoneId}", []); }
    public function setZoneMemory(int $zoneId, array $memory): void { $this->set("memory.zones.{$zoneId}", $memory); }

    public function getCivilizations(): array { return $this->get('civilizations', []); }
    public function getKnowledge(): array { return $this->get('civilization.knowledge_graph', []); }

    // --- META LAYER ---
    public function getTimeline(): array { return $this->data['timeline'] ?? []; }
    public function setTimeline(array $val): void { $this->data['timeline'] = $val; }

    /** @return \App\Modules\Intelligence\Entities\ActorEntity[] */
    public function getActorEntities(): array { return $this->actorEntities; }
    
    /** @param \App\Modules\Intelligence\Entities\ActorEntity[] $entities */
    public function setActorEntities(array $entities): void { $this->actorEntities = $entities; }

    /**
     * Remove an actor from the local entities collection to force reload.
     */
    public function forgetActor(int $actorId): void
    {
        $this->actorEntities = array_filter(
            $this->actorEntities,
            fn($a) => (int)$a->id !== $actorId
        );
    }

    /** @return \App\Modules\Institutions\Entities\InstitutionalEntity[] */
    public function getInstitutionalEntities(): array { return $this->institutionalEntities; }
    
    /** @param \App\Modules\Institutions\Entities\InstitutionalEntity[] $entities */
    public function setInstitutionalEntities(array $entities): void { $this->institutionalEntities = $entities; }

    /** @return \App\Modules\World\Entities\ResourceEntity[] */
    public function getResourceEntities(): array { return $this->resourceEntities; }

    /** @param \App\Modules\World\Entities\ResourceEntity[] $entities */
    public function setResourceEntities(array $entities): void { $this->resourceEntities = $entities; }

    /** @return \App\Modules\Intelligence\Entities\IdeaEntity[] */
    public function getIdeaEntities(): array { return $this->ideaEntities; }

    /** @param \App\Modules\Intelligence\Entities\IdeaEntity[] $entities */
    public function setIdeaEntities(array $entities): void { $this->ideaEntities = $entities; }

    /** @return \App\Modules\Narrative\Models\Chronicle[] */
    public function getRecentChronicles(): array { return $this->recentChronicles; }

    /** @param \App\Modules\Narrative\Models\Chronicle[] $chronicles */
    public function setRecentChronicles(array $chronicles): void { $this->recentChronicles = $chronicles; }

    /** @return \App\Modules\Intelligence\Models\SupremeEntity[] */
    public function getSupremeEntities(): array { return $this->supremeEntities; }

    /** @param \App\Modules\Intelligence\Models\SupremeEntity[] $entities */
    public function setSupremeEntities(array $entities): void { $this->supremeEntities = $entities; }

    public function getTick(): int { return (int)$this->get('tick', 0); }
    public function getUniverseId(): int { return (int)$this->get('universe_id', 0); }
    
    public function isObserved(): bool { return $this->isObserved; }
    public function setIsObserved(bool $val): void { $this->isObserved = $val; }

    // --- HELPERS ---
    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->data, $key, $default);
    }

    public function set(string $key, mixed $value): void
    {
        data_set($this->data, $key, $value);
    }

    public function getEntropy(): float { return (float)$this->get('entropy', 0.0); }
    public function setEntropy(float $val): void { $this->set('entropy', $val); }

    public function getStabilityIndex(): float { return (float)$this->get('stability_index', 1.0); }
    public function setStabilityIndex(float $val): void { $this->set('stability_index', $val); }

    /**
     * Phase 4: Create an immutable snapshot copy of the current state for rollback purposes.
     * Use before a risky resolution step so state can be restored on failure.
     */
    public function snapshot(): self
    {
        $copy = new self(
            data: $this->data,
            neighboring_realities: $this->neighboring_realities,
            legacy_data: $this->legacy_data,
            hyperspace_vector: $this->hyperspace_vector,
            nested_realities: $this->nested_realities
        );
        $copy->actorEntities        = $this->actorEntities;
        $copy->institutionalEntities = $this->institutionalEntities;
        $copy->resourceEntities     = $this->resourceEntities;
        $copy->ideaEntities         = $this->ideaEntities;
        $copy->recentChronicles     = $this->recentChronicles;
        $copy->supremeEntities      = $this->supremeEntities;
        $copy->isObserved           = $this->isObserved;
        return $copy;
    }

    /**
     * Phase 4: Restore internal state from a previously taken snapshot.
     */
    public function restoreFrom(self $snapshot): void
    {
        $this->data                   = $snapshot->data;
        $this->neighboring_realities  = $snapshot->neighboring_realities;
        $this->legacy_data            = $snapshot->legacy_data;
        $this->hyperspace_vector      = $snapshot->hyperspace_vector;
        $this->nested_realities       = $snapshot->nested_realities;
        $this->actorEntities          = $snapshot->actorEntities;
        $this->institutionalEntities  = $snapshot->institutionalEntities;
        $this->resourceEntities       = $snapshot->resourceEntities;
        $this->ideaEntities           = $snapshot->ideaEntities;
        $this->recentChronicles       = $snapshot->recentChronicles;
        $this->supremeEntities        = $snapshot->supremeEntities;
        $this->isObserved             = $snapshot->isObserved;
    }

    public function getScars(): array { return (array)$this->get('scars', []); }
    public function setScars(array $scars): void { $this->set('scars', $scars); }

    public function getActiveAttractor(): string { return (string)$this->get('active_attractor', 'none'); }
    public function setActiveAttractor(string $val): void { $this->set('active_attractor', $val); }

    public function getTopology(): array { return (array)$this->get('topology', []); }
    public function setTopology(array $val): void { $this->set('topology', $val); }

    public function getPreviousAttractor(): string { return (string)$this->get('previous_attractor', 'none'); }
    public function setPreviousAttractor(string $val): void { $this->set('previous_attractor', $val); }

    public function getAttractorStability(): float { return (float)$this->get('attractor_stability', 1.0); }
    public function setAttractorStability(float $val): void { $this->set('attractor_stability', $val); }

    public function getPressures(): array { return (array)$this->get('pressures', []); }
    public function setPressures(array $val): void { $this->set('pressures', $val); }

    public function getNeighboringRealities(): array
    {
        return $this->neighboring_realities;
    }

    public function setNeighboringRealities(array $realities): void
    {
        $this->neighboring_realities = $realities;
    }

    public function getLegacyData(): array
    {
        return $this->legacy_data;
    }

    public function setLegacyData(array $data): void
    {
        $this->legacy_data = $data;
    }

    /**
     * Phase 65: Hyperspace Vector (V9)
     */
    public function getHyperspaceVector(): array
    {
        return $this->hyperspace_vector;
    }

    public function setHyperspaceVector(array $vector): void
    {
        $this->hyperspace_vector = $vector;
    }

    /**
     * Phase 65: Project higher-dimensional state into 3D dashboard compatible fields.
     */
    public function projectTo3D(): void
    {
        if (empty($this->hyperspace_vector)) {
            return;
        }

        // Logic dự phóng từ 11D/22D xuống các trường 3D cơ bản (Power, Knowledge...)
        // Giả sử các chiều từ 0-9 của hyperspace tương ứng với các trường trong CFT.
        $dimensionMap = ['survival', 'power', 'wealth', 'knowledge', 'meaning', 'authority', 'fear', 'order', 'entropy', 'resonance'];
        
        $fields = $this->getFields();
        foreach ($dimensionMap as $index => $fieldName) {
            if (isset($this->hyperspace_vector[$index])) {
                $fields[$fieldName] = ($fields[$fieldName] ?? 0.0) * 0.7 + $this->hyperspace_vector[$index] * 0.3;
            }
        }
        $this->setFields($fields);
    }

    /**
     * Phase 66: Infinite Recursion (Nested Realities)
     */
    public function getNestedRealities(): array
    {
        return $this->nested_realities;
    }

    public function setNestedRealities(array $nested): void
    {
        $this->nested_realities = $nested;
    }

    public function pushNestedReality(array $stateData): void
    {
        $this->nested_realities[] = [
            'layer' => count($this->nested_realities) + 1,
            'data' => $stateData,
            'leakage_factor' => 0.01
        ];
    }

    // --- COMPATIBILITY ALIASES (Doc §5 legacy support) ---
    public function getStateVector(): array { return $this->data; }
    public function getMetrics(): array { return (array)$this->get('metrics', []); }
    public function getStateVectorKey(string $key, mixed $default = null): mixed { return $this->get($key, $default); }
    public function getMetric(string $key, mixed $default = null): mixed { return $this->get("metrics.{$key}", $default); }

    public static function getZonePressures(array $zone): array
    {
        $state = $zone['state'] ?? [];
        $pressures = $state['pressures'] ?? [];
        
        return [
            'war_pressure' => (float) ($pressures['war'] ?? ($state['war_pressure'] ?? 0)),
            'economic_pressure' => (float) ($pressures['economic'] ?? ($state['economic_pressure'] ?? 0)),
            'religious_pressure' => (float) ($pressures['religious'] ?? ($state['religious_pressure'] ?? 0)),
            'migration_pressure' => (float) ($pressures['migration'] ?? ($state['migration_pressure'] ?? 0)),
            'innovation_pressure' => (float) ($pressures['innovation'] ?? ($state['innovation_pressure'] ?? 0)),
        ];
    }

    public static function defaultZonePressureKeys(): array
    {
        return [
            'war_pressure' => 0.0,
            'economic_pressure' => 0.0,
            'religious_pressure' => 0.0,
            'migration_pressure' => 0.0,
            'innovation_pressure' => 0.0,
        ];
    }

    public static function defaultZonePopulationKeys(): array
    {
        return [
            'population_proxy' => 0.5,
        ];
    }

    public static function getZonePopulationProxy(array $zone): float
    {
        $state = $zone['state'] ?? [];
        return (float) ($state['population_proxy'] ?? 0.5);
    }
}

