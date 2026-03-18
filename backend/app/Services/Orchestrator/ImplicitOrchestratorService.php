<?php

namespace App\Services\Orchestrator;

use App\Models\Universe;
use App\Models\World;
use App\Services\Simulation\UniverseRuntimeService;
use Illuminate\Support\Facades\Log;

class ImplicitOrchestratorService
{
    public function __construct(
        protected \App\Simulation\Domain\Pipelines\SpawnPipeline $spawnPipeline
    ) {}

    /**
     * Spawn a new universe for a world (optionally forked from parent).
     */
    public function spawnUniverse(\App\Models\World $world, ?int $parentUniverseId = null, ?array $branchPayload = null): \App\Models\Universe
    {
        return $this->spawnPipeline->run($world, $parentUniverseId, $branchPayload);
    }

    /**
     * Fork universe at given tick (create child universe from parent state).
     */
    public function fork(\App\Models\Universe $universe, int $fromTick): \App\Models\Universe
    {
        return $this->spawnUniverse(
            $universe->world,
            $universe->id
        );
    }
}
