<?php

namespace App\Modules\Simulation\Core\Supervisor;

use App\Modules\Simulation\Core\EngineRegistry;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates advance flow: EngineDriver → StateSynchronizer → SnapshotManager → EventDispatcher → RuntimePipeline.
 */
final class SimulationSupervisor
{
    public function __construct(
        private readonly \App\Modules\Simulation\Contracts\UniverseRepositoryInterface $universeRepository,
        private readonly \App\Modules\Simulation\Contracts\SnapshotRepositoryInterface $snapshotRepository,
        private readonly EngineDriver $engineDriver,
        private readonly StateSynchronizer $stateSynchronizer,
        private readonly SnapshotManager $snapshotManager,
        private readonly EventDispatcher $eventDispatcher,
        private readonly RuntimePipeline $runtimePipeline,
        private readonly EngineRegistry $engineRegistry,
        private readonly \App\Modules\Simulation\Core\Runtime\EventDrivenScheduler $scheduler,
        private readonly \App\Modules\Simulation\Core\Runtime\State\StateManager $stateManager,
    ) {}

    /**
     * @return array{ok: bool, snapshot?: array, error_message?: string, ...}
     */
    public function execute(int $universeId, int $ticks): array
    {
        Log::info('Simulation: advance requested', ['universe_id' => $universeId, 'ticks' => $ticks]);

        $universe = $this->universeRepository->findById($universeId);

        if (! $universe || $universe->status === 'halted' || $universe->status === 'restarting') {
            Log::warning('Simulation: advance rejected (universe not found or halted)', ['universe_id' => $universeId]);
            return ['ok' => false, 'error_message' => 'Universe not found, is halted, or is restarting'];
        }

        // Logic advance forward
        $tickDurationMsTotal = 0;
        $engineResponse = ['ok' => true];

        for ($i = 0; $i < $ticks; $i++) {
            $tickStart = microtime(true);
            
            $engineResponse = $this->engineDriver->advance($universe, 1);
            if (! ($engineResponse['ok'] ?? false)) {
                Log::error('Simulation: engine failure', ['universe_id' => $universe->id, 'error' => $engineResponse['error_message'] ?? 'unknown']);
                return $engineResponse;
            }

            $snapshotData = $engineResponse['snapshot'] ?? [];
            $tickDurationMsPerTick = (float) ($engineResponse['_tick_duration_ms_per_tick'] ?? 0.0);
            $tickDurationMsTotal += $tickDurationMsPerTick;

            $engineManifest = $this->engineRegistry->getManifest();

            // Sync Entity & Persistence
            $this->stateSynchronizer->sync($universe, $snapshotData, 1, $engineManifest);

            // Snapshot Persistence via Repository
            $snapshot = $this->snapshotRepository->create([
                'universe_id' => $universe->id,
                'tick' => $universe->currentTick,
                'state_vector' => $universe->stateVector,
                'entropy' => $universe->entropy,
            ]);
            
            // Vector 7: Engine Health Monitor Tracking (§V11)
            $healthScore = max(0, min(100, 100 - (($tickDurationMsPerTick - 50) / 4.5)));
            $metrics = $snapshotData['metrics'] ?? [];
            if (!is_array($metrics)) {
                $metrics = [];
            }
            $metrics['engine_health'] = round($healthScore, 2);
            $metrics['last_tick_ms'] = round($tickDurationMsPerTick, 2);
            $snapshot->metrics = $metrics;

            $this->snapshotRepository->save($snapshot);

            // Internal Dispatching
            $this->eventDispatcher->dispatchPulsed($universe, $snapshot, $engineResponse, 1, $tickDurationMsPerTick);
            
            // Run common pipeline (Events, Evolutionary Leaps, etc.)
            $this->runtimePipeline->run(
                $universe,
                (int) $snapshotData['tick'],
                $snapshot,
                $engineResponse,
                1
            );
        }

        return $this->handleSuccess($universe);
    }

    private function handleSuccess(\App\Modules\Simulation\Entities\UniverseEntity $universe): array
    {
        $latest = $this->snapshotRepository->findLatestByUniverse($universe->id);
        return [
            'ok' => true,
            'universe_id' => $universe->id,
            'tick' => $universe->currentTick,
            'snapshot' => $latest ? $latest->toArray() : [],
        ];
    }
}

