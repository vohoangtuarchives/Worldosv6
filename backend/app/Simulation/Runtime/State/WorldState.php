<?php

namespace App\Simulation\Runtime\State;

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

    /** @var \App\Models\Chronicle[] */
    protected array $recentChronicles = [];

    /** @var \App\Models\SupremeEntity[] */
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

    public function getZones(): array { return $this->data['zones'] ?? []; }
    public function setZones(array $val): void { $this->data['zones'] = $val; }

    public function getCivilizations(): array { return $this->get('civilizations', []); }
    public function getKnowledge(): array { return $this->get('civilization.knowledge_graph', []); }

    // --- META LAYER ---
    public function getTimeline(): array { return $this->data['timeline'] ?? []; }
    public function setTimeline(array $val): void { $this->data['timeline'] = $val; }

    /** @return \App\Modules\Intelligence\Entities\ActorEntity[] */
    public function getActorEntities(): array { return $this->actorEntities; }
    
    /** @param \App\Modules\Intelligence\Entities\ActorEntity[] $entities */
    public function setActorEntities(array $entities): void { $this->actorEntities = $entities; }

    /** @return \App\Modules\Institutions\Entities\InstitutionalEntity[] */
    public function getInstitutionalEntities(): array { return $this->institutionalEntities; }
    
    /** @param \App\Modules\Institutions\Entities\InstitutionalEntity[] $entities */
    public function setInstitutionalEntities(array $entities): void { $this->institutionalEntities = $entities; }

    /** @return \App\Models\Chronicle[] */
    public function getRecentChronicles(): array { return $this->recentChronicles; }

    /** @param \App\Models\Chronicle[] $chronicles */
    public function setRecentChronicles(array $chronicles): void { $this->recentChronicles = $chronicles; }

    /** @return \App\Models\SupremeEntity[] */
    public function getSupremeEntities(): array { return $this->supremeEntities; }

    /** @param \App\Models\SupremeEntity[] $entities */
    public function setSupremeEntities(array $entities): void { $this->supremeEntities = $entities; }

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
}
