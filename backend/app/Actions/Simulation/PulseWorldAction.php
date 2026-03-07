<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;
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

        // Phase: Primordial Bootstrap — detect restarting universes and rebirth them
        $this->processRestartingUniverses($world);

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

    /**
     * Hỗn Nguyên Phase: Detect restarting universes and perform primordial bootstrap.
     *
     * After Eschaton, a universe enters 'restarting' status.
     * This method creates a primordial snapshot (tabula rasa) for the new epoch,
     * records the rebirth in Chronicle, then transitions back to 'active'.
     */
    protected function processRestartingUniverses(World $world): void
    {
        $restartingUniverses = Universe::where('world_id', $world->id)
            ->where('status', 'restarting')
            ->get();

        foreach ($restartingUniverses as $universe) {
            $this->rebirthUniverse($universe);
        }
    }

    /**
     * Rebirth: Create primordial state and activate the universe for the new epoch.
     */
    protected function rebirthUniverse(Universe $universe): void
    {
        $epoch = $universe->epoch ?? 1;
        $tick = $universe->current_tick ?? 0;

        // 1. Create primordial snapshot — tabula rasa state
        $primordialState = [
            'entropy'       => 0.5,
            'stability'     => 0.3,
            'knowledge'     => 0.01,
            'technology'    => 0.01,
            'institution'   => 0.01,
            'economy'       => 0.1,
            'militarism'    => 0.1,
            'population'    => 0.2,
            'inequality'    => 0.1,
            'culture'       => 0.05,
            'spirituality'  => 0.1,
            'environment'   => 0.9,
            'ai_dependency' => 0.0,
        ];

        UniverseSnapshot::updateOrCreate(
            ['universe_id' => $universe->id, 'tick' => $tick],
            [
                'state_vector'    => $primordialState,
                'entropy'         => 0.5,
                'stability_index' => 0.3,
                'metrics'         => [
                    'order'        => 0.05,
                    'energy_level' => 0.1,
                    'entropy'      => 0.5,
                    'epoch'        => $epoch,
                    'rebirth'      => true,
                ],
            ]
        );

        // 2. Reset universe state vector
        $universe->update([
            'status'       => 'active',
            'state_vector' => $primordialState,
        ]);

        // 3. Chronicle: record the rebirth
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick'   => $tick,
            'to_tick'     => $tick,
            'type'        => 'primordial_rebirth',
            'raw_payload' => [
                'action'      => 'legacy_event',
                'description' => "Từ tro tàn của kỷ nguyên cũ, hỗn nguyên lại khai mở. Epoch {$epoch} bắt đầu trong sự im lặng của vạn vật sơ khai.",
            ],
        ]);

        \Log::info("PRIMORDIAL REBIRTH: Universe #{$universe->id} reborn into Epoch {$epoch} at tick {$tick}.");
    }
}
