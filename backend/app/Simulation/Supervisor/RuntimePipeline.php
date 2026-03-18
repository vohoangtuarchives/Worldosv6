<?php

namespace App\Simulation\Supervisor;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Modules\Simulation\Entities\SnapshotEntity;
use App\Simulation\Runtime\SimulationTickOrchestrator;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;

/**
 * Runs tick pipeline then post-snapshot handlers (LEVEL 7) when snapshot was persisted.
 */
final class RuntimePipeline
{
    /** @param iterable<PostSnapshotHandlerInterface> $postSnapshotHandlers */
    public function __construct(
        private readonly SimulationTickOrchestrator $tickOrchestrator,
        private readonly iterable $postSnapshotHandlers,
    ) {}

    public function run(UniverseEntity $universe, int $tick, SnapshotEntity $snapshot, array $engineResponse, int $ticks): void
    {
        // Vẫn cần Eloquent models cho các sub-systems chưa refactor
        $universeModel = \App\Models\Universe::find($universe->id);
        $snapshotModel = \App\Models\UniverseSnapshot::find($snapshot->id);

        if ($universeModel && $snapshotModel) {
            $this->tickOrchestrator->run(
                $universeModel,
                $tick,
                $snapshotModel,
                array_merge($engineResponse, ['_ticks' => $ticks, 'snapshot' => $engineResponse['snapshot'] ?? []])
            );

            foreach ($this->postSnapshotHandlers as $handler) {
                if ($handler instanceof PostSnapshotHandlerInterface) {
                    $handler->handle($universeModel, $snapshotModel);
                }
            }
        }
    }
}
