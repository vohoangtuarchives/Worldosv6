<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Services\Simulation\UniverseRuntimeService;
use App\Services\Simulation\TemporalSyncService;
use App\Services\Simulation\AnomalyGeneratorService;

class PulseWorldAction
{
    public function __construct(
        protected UniverseRuntimeService $runtime,
        protected \App\Modules\Simulation\Services\WorldRegulatorEngine $autonomicEngine,
        protected TemporalSyncService $temporalSync,
        protected AnomalyGeneratorService $anomalyGenerator
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

        // Phase 96: Absolute Chronos (§V21)
        // Ensure all universes are locked to the world's master clock
        $this->temporalSync->advanceGlobalClock($world, $ticksPerUniverse);

        foreach ($universes as $universe) {
            $results[$universe->id] = $this->runtime->advance($universe->id, $ticksPerUniverse);
            $this->temporalSync->synchronize($universe);

            // Phase 109 & 110: Emergent Phenomena & Multiversal Bleed (§V25)
            if ($world->is_chaotic && rand(0, 1000) < 5) {
                // Determine if it's a cross-universe bleed or local anomaly
                if ($universes->count() > 1 && rand(0, 1) === 1) {
                    // Multiversal Bleed: Anomaly happens in a DIFFERENT random universe belonging to this world
                    $targetBleed = $universes->except($universe->id)->random();
                    $this->anomalyGenerator->spawnAnomaly($targetBleed);
                    \Log::info("MULTIVERSAL BLEED: Universe #{$universe->id} leaked an anomaly into Universe #{$targetBleed->id}.");
                } else {
                    $this->anomalyGenerator->spawnAnomaly($universe);
                }
            }
        }

        // Run World Autonomic Engine after pulsing all universes
        $this->autonomicEngine->process($world);

        return $results;
    }
}
