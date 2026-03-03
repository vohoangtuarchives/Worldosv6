<?php

namespace App\Actions\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Contracts\SimulationEngineClientInterface;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Material\MaterialLifecycleEngine;
use App\Services\Narrative\NarrativeAiService;

use App\Services\Simulation\CultureDiffusionService;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Services\Simulation\GenreBifurcationEngine;
use App\Services\Simulation\ZoneConflictEngine;
use App\Services\Simulation\WorldEdictEngine;
use App\Services\Simulation\AscensionEngine;

class AdvanceSimulationAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected SimulationEngineClientInterface $engine,
        protected UniverseSnapshotRepository $snapshots,
        protected \App\Services\Simulation\MultiverseSovereigntyService $sovereignty
    ) {}

    public function execute(int $universeId, int $ticks): array
    {
        $universe = $this->universeRepository->find($universeId);

        if (!$universe || $universe->status === 'halted') {
            return ['ok' => false, 'error' => 'Universe not found or is halted'];
        }

        $stateInput = $this->prepareEngineStateInput($universe);
        $worldConfig = $this->prepareWorldConfig($universe);
        $response = $this->engine->advance($universeId, $ticks, $stateInput, $worldConfig);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshotData = $response['snapshot'] ?? [];
        if (! empty($snapshotData)) {
            $savedSnapshot = $this->saveSnapshot($universe, $snapshotData);

            // FIRE EVENT: Decoupled logic handled by Listeners
            event(new \App\Events\Simulation\UniverseSimulationPulsed($universe, $savedSnapshot, $response));

            // Update Universe latest tick
            $this->universeRepository->update($universe->id, ['current_tick' => $savedSnapshot->tick]);

            // Phase 63: Total Sovereignty (§V10)
            $scars = $snapshotData['metrics']['scars'] ?? [];
            $this->sovereignty->orchestrate($universe, $scars);
        }

        return $response;
    }

    private function saveSnapshot($universe, array $snapshot)
    {
         $stateVector = is_string($snapshot['state_vector'] ?? null)
            ? json_decode($snapshot['state_vector'], true) ?? []
            : ($snapshot['state_vector'] ?? []);
            
        $metrics = is_string($snapshot['metrics'] ?? null)
            ? json_decode($snapshot['metrics'], true) ?? []
            : ($snapshot['metrics'] ?? []);
            
        $metrics['sci'] = $snapshot['sci'] ?? null;
        $metrics['instability_gradient'] = $snapshot['instability_gradient'] ?? null;
            
        return $this->snapshots->save($universe, [
            'tick' => $snapshot['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshot['entropy'] ?? null,
            'stability_index' => $snapshot['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
    }

    private function prepareEngineStateInput($universe): string
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $zones = [];
        $globalEntropy = $vec['entropy'] ?? 0.0;
        $knowledgeCore = $vec['knowledge_core'] ?? 0.0;
        $scars = $vec['scars'] ?? [];

        if (isset($vec['zones'])) {
            $zones = $vec['zones'];
            $globalEntropy = $vec['global_entropy'] ?? $globalEntropy;
        }

        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $stateObj = [
            'universe_id' => $universe->id,
            'tick' => (int)$universe->current_tick,
            'zones' => $zones,
            'global_entropy' => (float)$globalEntropy,
            'knowledge_core' => (float)$knowledgeCore,
            'scars' => $scars,
            'institutions' => $institutions->map(fn($e) => [
                'id' => $e->id,
                'type' => $e->entity_type,
                'capacity' => $e->org_capacity,
                'ideology' => $e->ideology_vector,
                'legitimacy' => $e->legitimacy,
                'influence' => $e->influence_map,
            ])->toArray(),
        ];

        return json_encode($stateObj);
    }

    private function prepareWorldConfig($universe): array
    {
        $world = $universe->world;
        return [
            'world_id' => (int) $world->id,
            'origin' => (string) $world->current_origin ?? 'generic',
            'axiom_json' => json_encode($world->evolution_genome ?? []),
            'world_seed_json' => json_encode($world->world_seed ?? []),
        ];
    }
}
