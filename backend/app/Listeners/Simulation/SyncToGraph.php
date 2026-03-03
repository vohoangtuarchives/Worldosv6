<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Contracts\GraphProviderInterface;
use Illuminate\Support\Facades\Log;

class SyncToGraph
{
    public function __construct(
        protected GraphProviderInterface $graphProvider
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;

        try {
            // Đồng bộ Snapshot mới vào Đồ thị (Virtual hoặc Neo4j)
            $this->graphProvider->sync($universe->id, [
                'snapshot_id' => $snapshot->id,
                'tick' => $snapshot->tick,
                'state' => $snapshot->state_vector,
            ]);

            Log::debug("SyncToGraph: Snapshot {$snapshot->id} synced for Universe {$universe->id}");
        } catch (\Throwable $e) {
            Log::error("SyncToGraph failed for Universe {$universe->id}: " . $e->getMessage());
        }
    }
}
