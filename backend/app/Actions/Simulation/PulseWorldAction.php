<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Services\Simulation\UniverseRuntimeService;

class PulseWorldAction
{
    public function __construct(
        protected UniverseRuntimeService $runtime
    ) {}

    /**
     * Pulse World: advance all active universes in the world.
     */
    public function execute(World $world, int $ticksPerUniverse): array
    {
        $results = [];
        $universes = Universe::where('world_id', $world->id)
            ->where('status', 'active')
            ->get();

        foreach ($universes as $universe) {
            $results[$universe->id] = $this->runtime->advance($universe->id, $ticksPerUniverse);
        }

        return $results;
    }
}
