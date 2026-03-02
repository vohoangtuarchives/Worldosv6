<?php

namespace App\Repositories;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Services\Observer\ObserverService;

class UniverseSnapshotRepository
{
    public function __construct(
        protected ?ObserverService $observer = null
    ) {}

    /**
     * Save snapshot for universe (from engine advance response).
     */
    public function save(Universe $universe, array $snapshot): UniverseSnapshot
    {
        $model = UniverseSnapshot::updateOrCreate(
            [
                'universe_id' => $universe->id,
                'tick' => $snapshot['tick'],
            ],
            [
                'state_vector' => $snapshot['state_vector'] ?? [],
                'entropy' => $snapshot['entropy'] ?? null,
                'stability_index' => $snapshot['stability_index'] ?? null,
                'metrics' => $snapshot['metrics'] ?? null,
            ]
        );

        $universe->update([
            'current_tick' => $snapshot['tick'],
            'state_vector' => $snapshot['state_vector'] ?? [],
        ]);

        if ($this->observer) {
            $this->observer->publishSnapshot(
                $universe->id,
                $universe->multiverse_id,
                $snapshot['tick'],
                ['entropy' => $snapshot['entropy'] ?? null, 'stability_index' => $snapshot['stability_index'] ?? null]
            );
        }

        // Broadcast realtime event for Centrifugo
        event(new \App\Events\Domain\Universe\UniversePulsed($universe, $model));

        return $model;
    }

    /**
     * Get snapshot at specific tick.
     */
    public function getAtTick(int $universeId, int $tick): ?UniverseSnapshot
    {
        return UniverseSnapshot::where('universe_id', $universeId)
            ->where('tick', $tick)
            ->first();
    }

    /**
     * Get latest snapshot for universe.
     */
    public function getLatest(int $universeId): ?UniverseSnapshot
    {
        return UniverseSnapshot::where('universe_id', $universeId)
            ->orderByDesc('tick')
            ->first();
    }
}
