<?php

namespace App\Simulation\Supervisor;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Simulation\EngineRegistry;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates advance flow: EngineDriver → StateSynchronizer → SnapshotManager → EventDispatcher → RuntimePipeline.
 */
final class SimulationSupervisor
{
    public function __construct(
        private readonly UniverseRepositoryInterface $universeRepository,
        private readonly EngineDriver $engineDriver,
        private readonly StateSynchronizer $stateSynchronizer,
        private readonly SnapshotManager $snapshotManager,
        private readonly EventDispatcher $eventDispatcher,
        private readonly RuntimePipeline $runtimePipeline,
        private readonly EngineRegistry $engineRegistry,
    ) {}

    /**
     * @return array{ok: bool, snapshot?: array, error_message?: string, ...}
     */
    public function execute(int $universeId, int $ticks): array
    {
        Log::info('Simulation: advance requested', ['universe_id' => $universeId, 'ticks' => $ticks]);

        $universe = $this->universeRepository->find($universeId);

        if (! $universe || $universe->status === 'halted' || $universe->status === 'restarting') {
            Log::warning('Simulation: advance rejected (universe not found or halted)', ['universe_id' => $universeId]);

            return ['ok' => false, 'error_message' => 'Universe not found, is halted, or is restarting'];
        }
        if (! $universe->world) {
            Log::warning('Simulation: advance rejected (universe has no world)', ['universe_id' => $universeId]);

            return ['ok' => false, 'error_message' => 'Universe has no world'];
        }

        $response = $this->engineDriver->advance($universe, $ticks);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshotData = $response['snapshot'] ?? [];
        if (empty($snapshotData)) {
            return $response;
        }

        $tickDurationMsPerTick = (float) ($response['_tick_duration_ms_per_tick'] ?? 0.0);
        $engineManifest = $this->engineRegistry->getManifest();

        $this->stateSynchronizer->sync($universe, $snapshotData, $ticks, $engineManifest);

        $snapshot = $this->snapshotManager->persistOrVirtual($universe, $snapshotData, $tickDurationMsPerTick, $engineManifest);

        $this->eventDispatcher->dispatchPulsed($universe, $snapshot, $response, $ticks, $tickDurationMsPerTick);

        $this->runtimePipeline->run(
            $universe,
            (int) $snapshotData['tick'],
            $snapshot,
            $response,
            $ticks
        );

        return $response;
    }
}
