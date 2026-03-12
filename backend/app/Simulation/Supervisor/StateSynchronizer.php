<?php

namespace App\Simulation\Supervisor;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Services\Simulation\TemporalSyncService;
use App\Simulation\Contracts\StateCacheInterface;

/**
 * Syncs state from engine snapshot back to universe (temporal sync + state_vector update).
 * When state_cache driver=redis, also writes state to cache (Phase 2 §2.3).
 */
final class StateSynchronizer
{
    public function __construct(
        private readonly UniverseRepositoryInterface $universeRepository,
        private readonly TemporalSyncService $temporalSync,
        private readonly StateCacheInterface $stateCache,
    ) {}

    public function sync(Universe $universe, array $snapshotData, int $ticks, ?array $engineManifest = null): void
    {
        $this->temporalSync->advanceGlobalClock($universe->world, $ticks);
        $this->temporalSync->synchronize($universe);

        if (is_array($engineManifest)) {
            $this->universeRepository->update($universe->id, ['engine_manifest' => $engineManifest]);
        }

        $this->syncUniverseFromSnapshotData($universe, $snapshotData);
    }

    private function syncUniverseFromSnapshotData(Universe $universe, array $snapshotData): void
    {
        $stateVector = is_string($snapshotData['state_vector'] ?? null)
            ? json_decode($snapshotData['state_vector'], true) ?? []
            : ($snapshotData['state_vector'] ?? []);

        if (! isset($stateVector['zones']) && isset($stateVector[0]['state'])) {
            $stateVector = ['zones' => $stateVector];
        }

        $stateVector['entropy'] = (float) ($snapshotData['entropy'] ?? 0.0);
        $stateVector['global_entropy'] = (float) ($snapshotData['entropy'] ?? 0.0);
        $stateVector['sci'] = (float) ($snapshotData['sci'] ?? 1.0);
        $stateVector['instability_gradient'] = (float) ($snapshotData['instability_gradient'] ?? 0.0);

        $metrics = is_string($snapshotData['metrics'] ?? null)
            ? json_decode($snapshotData['metrics'], true) ?? []
            : ($snapshotData['metrics'] ?? []);

        $stateVector['knowledge_core'] = (float) ($stateVector['knowledge_core'] ?? ($metrics['knowledge_core'] ?? 0.0));
        $stateVector['scars'] = $metrics['scars'] ?? ($stateVector['scars'] ?? []);
        $stateVector['attractors'] = is_array($stateVector['attractors'] ?? null) ? $stateVector['attractors'] : [];
        $stateVector['dark_attractors'] = is_array($stateVector['dark_attractors'] ?? null) ? $stateVector['dark_attractors'] : [];

        $existingVec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $stateVector['macro_agents'] = is_array($stateVector['macro_agents'] ?? null) ? $stateVector['macro_agents'] : ($existingVec['macro_agents'] ?? []);

        $fields = null;
        if (! empty($snapshotData['global_fields'])) {
            $fields = is_string($snapshotData['global_fields'])
                ? json_decode($snapshotData['global_fields'], true)
                : $snapshotData['global_fields'];
        }
        if ($fields === null && ! empty($metrics['civ_fields'])) {
            $fields = $metrics['civ_fields'];
        }
        if (is_array($fields)) {
            $stateVector['fields'] = $fields;
        }

        if (! empty($stateVector['zones']) && is_array($stateVector['zones'])) {
            $zoneFields = [];
            foreach ($stateVector['zones'] as $idx => $zone) {
                $cf = $zone['state']['civ_fields'] ?? null;
                if (is_array($cf)) {
                    $zoneFields[$idx] = $cf;
                }
            }
            if ($zoneFields !== []) {
                $stateVector['zone_fields'] = $zoneFields;
            }
        }

        $this->universeRepository->update($universe->id, [
            'current_tick' => $snapshotData['tick'],
            'state_vector' => $stateVector,
            'entropy' => $stateVector['entropy'],
        ]);
        $universe->refresh();

        $tick = (int) ($snapshotData['tick'] ?? 0);
        $this->stateCache->set((int) $universe->id, $stateVector, $tick);
    }
}
