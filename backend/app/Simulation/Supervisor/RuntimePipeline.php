<?php

namespace App\Simulation\Supervisor;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
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

    public function run(Universe $universe, int $tick, UniverseSnapshot $snapshot, array $engineResponse, int $ticks): void
    {
        $this->tickOrchestrator->run(
            $universe,
            $tick,
            $snapshot,
            array_merge($engineResponse, ['_ticks' => $ticks, 'snapshot' => $engineResponse['snapshot'] ?? []])
        );

        if ($snapshot->exists) {
            foreach ($this->postSnapshotHandlers as $handler) {
                if ($handler instanceof PostSnapshotHandlerInterface) {
                    $handler->handle($universe, $snapshot);
                }
            }
        }
    }
}
