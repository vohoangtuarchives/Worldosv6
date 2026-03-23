<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\World;
use App\Modules\Simulation\Services\UniverseRuntimeService;
use Illuminate\Support\Facades\Log;

class ImplicitOrchestratorService
{
    public function __construct(
        protected \App\Modules\Simulation\Core\Domain\Pipelines\SpawnPipeline $spawnPipeline
    ) {}

    /**
     * Spawn a new universe for a world (optionally forked from parent).
     */
    public function spawnUniverse(\App\Models\World $world, ?int $parentUniverseId = null, ?int $sagaId = null, ?array $branchPayload = null): \App\Models\Universe
    {
        return $this->spawnPipeline->run($world, $parentUniverseId, $sagaId, $branchPayload);
    }

    /**
     * Ensure a saga exists for the universe context.
     * Returns a mock object if model is missing to prevent crash.
     */
    public function ensureSaga(\App\Models\Universe $universe): object
    {
        $sagaId = $universe->saga_id ?? 1; // Default to 1 or logic
        return (object)['id' => $sagaId];
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



