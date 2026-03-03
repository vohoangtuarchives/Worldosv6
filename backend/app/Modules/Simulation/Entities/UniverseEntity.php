<?php

namespace App\Modules\Simulation\Entities;

class UniverseEntity
{
    public function __construct(
        public readonly int $id,
        public readonly int $worldId,
        public readonly string $name,
        public float $entropy,
        public float $stabilityIndex,
        public float $observationLoad,
        public array $stateVector,
        public ?string $status = 'active'
    ) {}

    public function applyObservationInterference(float $intensity): void
    {
        $this->observationLoad += $intensity;
        $this->entropy = max(0.0, $this->entropy - ($intensity * 0.05));
        $this->stabilityIndex = min(1.0, $this->stabilityIndex + ($intensity * 0.1));
        
        $this->stateVector['entropy'] = $this->entropy;
        $this->stateVector['stability_index'] = $this->stabilityIndex;
    }

    public function decayObservationLoad(float $decay): void
    {
        $this->observationLoad = max(0.0, $this->observationLoad - $decay);
    }
}
