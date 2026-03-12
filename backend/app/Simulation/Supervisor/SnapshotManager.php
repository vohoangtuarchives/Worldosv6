<?php

namespace App\Simulation\Supervisor;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Repositories\UniverseSnapshotRepository;
use App\Simulation\Contracts\SnapshotArchiveInterface;
use App\Simulation\EngineRegistry;
use App\Simulation\Support\SnapshotLoader;
use App\Simulation\SimulationKernel;

/**
 * Persists or creates virtual snapshot; optionally runs SimulationKernel post-tick.
 */
final class SnapshotManager
{
    public function __construct(
        private readonly UniverseSnapshotRepository $snapshots,
        private readonly SnapshotLoader $snapshotLoader,
        private readonly SimulationKernel $simulationKernel,
        private readonly EngineRegistry $engineRegistry,
        private readonly SnapshotArchiveInterface $snapshotArchive,
    ) {}

    public function persistOrVirtual(Universe $universe, array $snapshotData, float $tickDurationMsPerTick, ?array $engineManifest = null): UniverseSnapshot
    {
        $interval = (int) ($universe->world->snapshot_interval ?? 1);
        $shouldSave = ((int) ($snapshotData['tick'] ?? 0) % $interval === 0) || ((int) ($snapshotData['tick'] ?? 0) === 0);

        if ($shouldSave) {
            $saved = $this->saveSnapshot($universe, $snapshotData, $tickDurationMsPerTick, $engineManifest);
            $this->snapshotArchive->archive($universe, $saved);
            $tickDriver = config('worldos.simulation_tick_driver', 'rust_only');
            if ($tickDriver === 'laravel_kernel' && config('worldos.simulation_kernel_post_tick')) {
                $state = $this->snapshotLoader->fromSnapshot($universe, $saved);
                $ctx = new \App\Simulation\Domain\TickContext(
                    (int) $universe->id,
                    (int) $saved->tick,
                    (int) ($universe->seed ?? 0)
                );
                $newState = $this->simulationKernel->runTick($state, $ctx);
                $saved = $this->snapshots->save($universe, [
                    'tick' => $newState->getTick(),
                    'state_vector' => $newState->getStateVector(),
                    'entropy' => $newState->getEntropy(),
                    'stability_index' => $newState->getStateVectorKey('stability_index') ?? $newState->getMetric('stability_index'),
                    'metrics' => $newState->getMetrics(),
                ]);
            }

            return $saved;
        }

        return $this->makeVirtualSnapshot($universe, $snapshotData, $tickDurationMsPerTick, $engineManifest);
    }

    private function saveSnapshot(Universe $universe, array $snapshot, ?float $tickDurationMs = null, ?array $engineManifest = null): UniverseSnapshot
    {
        $stateVector = is_string($snapshot['state_vector'] ?? null)
            ? json_decode($snapshot['state_vector'], true) ?? []
            : ($snapshot['state_vector'] ?? []);

        $metrics = is_string($snapshot['metrics'] ?? null)
            ? json_decode($snapshot['metrics'], true) ?? []
            : ($snapshot['metrics'] ?? []);

        $metrics['sci'] = $snapshot['sci'] ?? null;
        $metrics['instability_gradient'] = $snapshot['instability_gradient'] ?? null;
        if ($tickDurationMs !== null) {
            $metrics['tick_duration_ms'] = round($tickDurationMs, 2);
        }
        if (is_array($engineManifest)) {
            $metrics['engine_manifest'] = $engineManifest;
        }

        return $this->snapshots->save($universe, [
            'tick' => $snapshot['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshot['entropy'] ?? null,
            'stability_index' => $snapshot['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
    }

    private function makeVirtualSnapshot(Universe $universe, array $snapshotData, ?float $tickDurationMs = null, ?array $engineManifest = null): UniverseSnapshot
    {
        $stateVector = is_string($snapshotData['state_vector'] ?? null)
            ? json_decode($snapshotData['state_vector'], true) ?? []
            : ($snapshotData['state_vector'] ?? []);
        $metrics = is_string($snapshotData['metrics'] ?? null)
            ? json_decode($snapshotData['metrics'], true) ?? []
            : ($snapshotData['metrics'] ?? []);
        $metrics['sci'] = $snapshotData['sci'] ?? null;
        $metrics['instability_gradient'] = $snapshotData['instability_gradient'] ?? null;
        if ($tickDurationMs !== null) {
            $metrics['tick_duration_ms'] = round($tickDurationMs, 2);
        }
        if (is_array($engineManifest)) {
            $metrics['engine_manifest'] = $engineManifest;
        }

        $snap = new UniverseSnapshot([
            'universe_id' => $universe->id,
            'tick' => $snapshotData['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshotData['entropy'] ?? null,
            'stability_index' => $snapshotData['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
        $snap->setRelation('universe', $universe);

        return $snap;
    }
}
