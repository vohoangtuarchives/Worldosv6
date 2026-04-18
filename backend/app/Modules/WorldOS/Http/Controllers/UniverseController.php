<?php

namespace App\Modules\WorldOS\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Actor;
use App\Models\Chronicle;
use App\Models\Myth;
use App\Models\MythScar;
use App\Models\Religion;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\World;
use App\Modules\Simulation\Actions\AdvanceSimulationAction;
use App\Modules\Simulation\Actions\PulseWorldAction;
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use App\Modules\WorldOS\Actions\ForkUniverseAction;
use App\Modules\WorldOS\Actions\CreateGenesisUniverseAction;
use App\Modules\WorldOS\Http\Resources\BranchComparisonResource;
use App\Modules\WorldOS\Http\Resources\BranchSummaryResource;
use App\Modules\WorldOS\Http\Resources\SnapshotDetailResource;
use App\Modules\WorldOS\Http\Resources\SnapshotResource;
use App\Modules\WorldOS\Http\Resources\UniverseDetailResource;
use App\Modules\WorldOS\Http\Resources\UniverseDossierResource;
use App\Modules\WorldOS\Http\Resources\UniverseMetricsResource;
use App\Modules\WorldOS\Http\Resources\UniverseSummaryResource;
use App\Modules\WorldOS\Http\Resources\Support\WorldOsResourceSupport;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Engines\Meta\HistoryEngine;
use App\Modules\Intelligence\Actions\GetUniverseMaterialsAction;
use App\Modules\Simulation\Services\Civilization\CultureIdentityProjector;
use App\Modules\Simulation\Services\Civilization\CivilizationDossierProjector;
use App\Modules\Simulation\Services\Civilization\MaterialIdentityProjector;
use App\Modules\WorldOS\Services\UniverseMetricsService;
use App\Modules\WorldOS\Services\UniverseDossierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UniverseController extends Controller
{
    public function index(): JsonResponse
    {
        $query = Universe::with([
            'world:id,name,slug,current_genre,base_genre',
            'latestSnapshot',
        ])->withCount('childUniverses');

        if (request()->has('world_id')) {
            $query->where('world_id', (int) request('world_id'));
        }

        return UniverseSummaryResource::collection($query->get())->response();
    }

    public function show(string $id): JsonResponse
    {
        $universe = Universe::with([
            'world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic',
            'latestSnapshot',
        ])->withCount('childUniverses')->findOrFail((int) $id);

        $universe->update(['last_observed_at' => now()]);
        $universe->refresh();
        $universe->loadMissing([
            'world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic',
            'latestSnapshot',
        ]);

        return (new UniverseDetailResource($universe))->response();
    }

    public function metrics(string $id, UniverseMetricsService $metricsService): JsonResponse
    {
        return (new UniverseMetricsResource($metricsService->getMetrics((int) $id)))->response();
    }

    public function dossier(string $id, UniverseDossierService $dossierService): JsonResponse
    {
        return (new UniverseDossierResource($dossierService->getDossier((int) $id)))->response();
    }

    public function toggleStatus(string $id): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $newStatus = WorldOsResourceSupport::normalizeUniverseStatus($universe->status) === 'active' ? 'inactive' : 'active';
        $universe->update(['status' => $newStatus]);

        return response()->json([
            'ok' => true,
            'new_status' => WorldOsResourceSupport::normalizeUniverseStatus($newStatus),
            'data' => [
                'id' => $universe->id,
                'status' => WorldOsResourceSupport::normalizeUniverseStatus($newStatus),
            ],
        ]);
    }

    public function snapshot(string $id, UniverseSnapshotRepository $repo): JsonResponse
    {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Snapshot not found'], 404);
        }

        return (new SnapshotDetailResource($snapshot))->response();
    }

    public function snapshots(string $id): JsonResponse
    {
        $limit = (int) request()->query('limit', 50);
        $limit = $limit > 0 && $limit <= 500 ? $limit : 50;

        $rows = UniverseSnapshot::where('universe_id', (int) $id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get(['id', 'universe_id', 'tick', 'state_vector', 'entropy', 'stability_index', 'metrics', 'created_at']);

        return SnapshotResource::collection($rows)->response();
    }

    public function createSnapshot(string $id, UniverseSnapshotRepository $repo): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $stateVector = is_array($universe->state_vector) ? $universe->state_vector : [];
        $snapshot = $repo->save($universe, [
            'tick' => (int) ($universe->current_tick ?? 0),
            'state_vector' => $stateVector,
            'entropy' => (float) ($universe->entropy ?? data_get($stateVector, 'entropy', 0)),
            'stability_index' => (float) ($universe->structural_coherence ?? data_get($stateVector, 'stability_index', 0)),
            'metrics' => WorldOsResourceSupport::toMetricArray(data_get($stateVector, 'metrics', [])),
        ]);

        return response()->json([
            'ok' => true,
            'data' => [
                'created' => $snapshot->wasRecentlyCreated,
                'snapshot' => (new SnapshotDetailResource($snapshot))->resolve(),
            ],
        ]);
    }

    public function getSnapshot(string $snapshotId): JsonResponse
    {
        $snapshot = UniverseSnapshot::findOrFail((int) $snapshotId);

        return (new SnapshotDetailResource($snapshot))->response();
    }

    public function forks(string $id): JsonResponse
    {
        $rows = Universe::query()
            ->where('parent_universe_id', (int) $id)
            ->orderByDesc('forked_at_tick')
            ->get(['id', 'parent_universe_id', 'name', 'status', 'forked_at_tick', 'current_tick', 'created_at']);

        return BranchSummaryResource::collection($rows)->response();
    }

    public function compareFork(string $id): JsonResponse
    {
        $validated = request()->validate([
            'branch_id' => ['required', 'integer'],
        ]);

        $universe = Universe::with('latestSnapshot')->findOrFail((int) $id);
        $branch = Universe::with('latestSnapshot')
            ->where('parent_universe_id', $universe->id)
            ->findOrFail((int) $validated['branch_id']);

        $source = $this->buildComparableUniversePayload($universe);
        $target = $this->buildComparableUniversePayload($branch);

        return (new BranchComparisonResource([
            'universe_id' => $universe->id,
            'branch_id' => $branch->id,
            'source' => $source,
            'branch' => $target,
            'tick_span' => (int) $target['tick'] - (int) $source['tick'],
            'deltas' => [
                'current_tick' => (int) $target['current_tick'] - (int) $source['current_tick'],
                'entropy' => round((float) $target['entropy'] - (float) $source['entropy'], 4),
                'stability_index' => round((float) $target['stability_index'] - (float) $source['stability_index'], 4),
            ],
            'metric_deltas' => WorldOsResourceSupport::numericMetricDeltas(
                $source['metrics'] ?? [],
                $target['metrics'] ?? [],
            ),
        ]))->response();
    }

    public function fork(string $id, ForkUniverseAction $action, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tick' => 'nullable|integer|min:0',
        ]);

        $tick = (int) ($validated['tick'] ?? 0);
        $name = $request->input('name');
        $universe = Universe::findOrFail((int) $id);

        $child = $action->handle($universe, $tick, $name);
        $child->refresh();

        return response()->json([
            'ok' => true,
            'child_universe_id' => $child->id,
            'data' => [
                'child_universe_id' => $child->id,
                'branch' => (new BranchSummaryResource($child))->resolve(),
            ],
        ]);
    }

    public function pulse(string $id, PulseWorldAction $action): JsonResponse
    {
        $world = World::findOrFail((int) $id);

        return response()->json([
            'ok' => true,
            'results' => $action->execute($world, (int) request()->input('ticks_per_universe', 5)),
        ]);
    }

    public function advance(AdvanceSimulationAction $action, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'universe_id' => 'required|integer|min:1|exists:universes,id',
            'ticks' => 'required|integer|min:1|max:1000',
        ]);

        $universeId = (int) $validated['universe_id'];
        $ticks = (int) $validated['ticks'];

        return response()->json($action->execute($universeId, $ticks));
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $universe->update($request->only(['name', 'status']));
        $universe->loadMissing([
            'world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic',
            'latestSnapshot',
        ])->loadCount('childUniverses');

        return response()->json([
            'ok' => true,
            'data' => (new UniverseDetailResource($universe))->resolve(),
        ]);
    }

    public function store(Request $request, CreateGenesisUniverseAction $action): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'base_genre' => ['nullable', 'string'],
            'axioms' => ['nullable', 'array'],
            'initial_state' => ['nullable', 'array'],
        ]);

        $universe = $action->doExecute($validated);

        return response()->json([
            'ok' => true,
            'data' => (new UniverseDetailResource($universe))->resolve(),
        ], 201);
    }

    public function realityState(string $id, GetUniverseMaterialsAction $materialsAction): JsonResponse
    {
        $universe = Universe::with(['latestSnapshot', 'world'])->findOrFail((int) $id);
        $snapshot = $universe->latestSnapshot;

        // Use snapshot state if available, otherwise fallback to universe's genesis state vector
        $stateVector = [];
        if ($snapshot) {
            $stateVector = is_array($snapshot->state_vector) ? $snapshot->state_vector : (json_decode($snapshot->state_vector, true) ?? []);
        } else {
            $stateVector = is_array($universe->state_vector) ? $universe->state_vector : (json_decode($universe->state_vector, true) ?? []);
        }

        $worldState = WorldState::fromArray($stateVector);

        // Extract layered data
        $physical = $worldState->getPhysicalLayer();
        $life = $worldState->getLifeLayer();
        $social = $worldState->getSocialLayer();
        $narrative = $worldState->getNarrativeLayer();

        // Integrate materialized items
        $materials = $materialsAction->execute((int) $id);

        return response()->json([
            'universe_id' => $universe->id,
            'tick' => (int) ($snapshot?->tick ?? $universe->current_tick ?? 0),
            'era' => $universe->world->civilization_era ?? 'genesis',
            'pulse' => [
                'entropy' => (float) ($snapshot?->entropy ?? $universe->entropy ?? 0),
                'stability_index' => (float) ($snapshot?->stability_index ?? $universe->structural_coherence ?? 0),
                'entropy_threshold' => 1.0, 
                'collapse_probability' => (float) ($stateVector['collapse_probability'] ?? 0),
            ],
            'layers' => [
                'physical' => $physical,
                'life' => $life,
                'social' => $social,
                'narrative' => $narrative,
            ],
            'materials' => $materials,
            'civilization' => [
                'complexity' => (float)(data_get($stateVector, 'civilization.discovery.fitness', 0)),
                'knowledge_nodes' => count(data_get($stateVector, 'civilization.knowledge_graph.nodes', [])),
                'settlements' => data_get($stateVector, 'civilization.settlements', []),
                'material_identity' => ($snapshot?->metrics['material_identity'] ?? []),
                'culture_identity' => app(CultureIdentityProjector::class)->projectFromState($stateVector),
            ],
            'vfx_config' => WorldOsResourceSupport::getVfxConfigForEra($universe->world->civilization_era),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);

        UniverseSnapshot::where('universe_id', $universe->id)->delete();
        $universe->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Universe deleted successfully',
            'data' => [
                'id' => (int) $id,
                'deleted' => true,
            ],
        ]);
    }

    private function buildComparableUniversePayload(Universe $universe): array
    {
        $latestSnapshot = $universe->latestSnapshot;

        return [
            'id' => $universe->id,
            'name' => $universe->name ?: "Universe {$universe->id}",
            'status' => WorldOsResourceSupport::normalizeUniverseStatus($universe->status),
            'forked_at_tick' => (int) ($universe->forked_at_tick ?? 0),
            'current_tick' => (int) ($universe->current_tick ?? 0),
            'snapshot_id' => $latestSnapshot?->id,
            'tick' => (int) ($latestSnapshot?->tick ?? $universe->current_tick ?? 0),
            'entropy' => (float) ($latestSnapshot?->entropy ?? $universe->entropy ?? 0),
            'stability_index' => (float) ($latestSnapshot?->stability_index ?? $universe->structural_coherence ?? 0),
            'metrics' => WorldOsResourceSupport::toMetricArray($latestSnapshot?->metrics),
        ];
    }
}
