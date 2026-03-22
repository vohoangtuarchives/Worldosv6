<?php

use App\Modules\Simulation\Http\Controllers\WorldController;
use App\Modules\Simulation\Http\Controllers\UniverseController;
use App\Modules\Simulation\Http\Controllers\UniverseSnapshotController;
use App\Modules\Simulation\Http\Controllers\RuleSetLibraryController;
use App\Modules\Simulation\Http\Controllers\VocationLibraryController;
use App\Modules\Simulation\Http\Controllers\WorldosEnginesController;
use App\Modules\Simulation\Http\Controllers\IpFactoryController;
use App\Modules\Intelligence\Http\Controllers\ObserverDashboardController;
use App\Modules\Simulation\Http\Controllers\MaterialMutationController;
use App\Modules\Simulation\Http\Controllers\MultiverseMapController;
use App\Modules\Simulation\Http\Controllers\UniverseGraphController;
use App\Modules\Simulation\Actions\AdvanceSimulationAction;
use App\Modules\Simulation\Actions\PulseWorldAction;
use App\Modules\Simulation\Actions\WorldAxiomAction;
use App\Modules\Simulation\Actions\ExportWorldAction;
use App\Modules\Simulation\Actions\ImportWorldAction;
use App\Modules\Simulation\Actions\GetUniverseTopologyAction;
use App\Modules\Simulation\Actions\GetMultiverseTreeAction;
use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\World;
use App\Modules\Simulation\Models\BranchEvent;
use App\Modules\Simulation\Models\MaterialInstance;
use App\Modules\Simulation\Models\Material;
use App\Modules\Simulation\Models\UniverseInteraction;
use App\Modules\Simulation\Models\CausalTrajectory;
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use App\Modules\Simulation\Services\ImplicitOrchestratorService;
use App\Modules\Simulation\Services\ScenarioEngine;
use App\Modules\Institutions\Services\WorldEdictEngine;
use App\Contracts\UniverseEvaluatorInterface;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    Route::get('worlds', function () {
        $worlds = World::with('multiverse:id,name')->get(['id', 'multiverse_id', 'name', 'slug', 'current_genre', 'base_genre']);
        return response()->json($worlds);
    })->name('worldos.worlds.index');

    Route::get('library/rulesets', [RuleSetLibraryController::class, 'index']);
    Route::get('library/vocations', [VocationLibraryController::class, 'index']);
    Route::get('library/vocations/{id}', [VocationLibraryController::class, 'show']);

    Route::post('worlds', function (ImplicitOrchestratorService $orchestrator) {
        $name = request()->input('name');
        $description = request()->input('description', '');
        $axioms = request()->input('axioms', []);
        $genre = request()->input('genre', 'wuxia');
        
        if (empty($name)) {
            return response()->json(['ok' => false, 'error' => 'name required'], 422);
        }
        
        $multiverse = \App\Modules\Simulation\Models\Multiverse::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Prime Multiverse']
        );
        
        $world = World::create([
            'multiverse_id' => $multiverse->id,
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name) . '-' . uniqid(),
            'axiom' => array_merge(['entropy_conservation' => true], $axioms),
            'world_seed' => ['description' => $description],
            'origin' => request()->input('origin', 'Vietnamese'),
            'current_genre' => $genre,
            'base_genre' => $genre,
            'is_autonomic' => request()->input('is_autonomic', true),
        ]);

        $universe = $orchestrator->spawnUniverse($world);
        
        return response()->json([
            'ok' => true, 
            'world' => $world,
            'universe_id' => $universe->id
        ]);
    })->name('worldos.worlds.store');

    Route::get('worlds/{id}/timelines', [WorldosEnginesController::class, 'worldTimelines'])->name('worldos.worlds.timelines');
    Route::get('engines', [WorldosEnginesController::class, 'index'])->name('worldos.engines');
    Route::get('engines/status', [WorldosEnginesController::class, 'status'])->name('worldos.engines.status');
    Route::get('metrics', [WorldosEnginesController::class, 'metrics'])->name('worldos.metrics');

    Route::get('universes', function () {
        $query = Universe::with(['world:id,name,slug,current_genre,base_genre']);
        if (request()->has('world_id')) {
            $query->where('world_id', (int) request('world_id'));
        }
        return response()->json($query->get());
    })->name('worldos.universes.index');

    Route::get('universes/{id}', function (string $id) {
        $universe = Universe::with(['world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic'])->findOrFail((int) $id);
        $universe->update(['last_observed_at' => now()]);
        return response()->json(['data' => $universe]);
    })->name('worldos.universes.show');

    Route::get('universes/{id}/snapshot', function (string $id, UniverseSnapshotRepository $repo) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        }
        return response()->json($snapshot);
    })->name('worldos.universes.snapshot');

    Route::get('universes/{id}/snapshots', function (string $id) {
        $limit = (int) request()->query('limit', 50);
        $limit = $limit > 0 && $limit <= 500 ? $limit : 50;
        $rows = \App\Modules\Simulation\Models\UniverseSnapshot::where('universe_id', (int) $id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get(['id', 'universe_id', 'tick', 'entropy', 'stability_index', 'metrics'])
            ->toArray();
        return response()->json(array_reverse($rows));
    })->name('worldos.universes.snapshots');

    Route::get('universes/{id}/materials', function (string $id) {
        $materials = MaterialInstance::with('material:id,name,ontology,description')
            ->where('universe_id', (int) $id)
            ->where('lifecycle', 'active')
            ->get();
        return response()->json($materials);
    })->name('worldos.universes.materials');

    Route::get('universes/{id}/branch-events', function (string $id) {
        $events = BranchEvent::where('universe_id', (int) $id)
            ->orderByDesc('from_tick')
            ->get();
        return response()->json($events);
    })->name('worldos.universes.branch-events');

    Route::get('edicts', function (WorldEdictEngine $engine) {
        return response()->json($engine->getEdictDictionary());
    })->name('worldos.edicts.list');

    Route::get('universes/{id}/interactions', function (string $id) {
        $interactions = UniverseInteraction::with(['universeA:id,name', 'universeB:id,name'])
            ->where(function($q) use ($id) {
                $q->where('universe_a_id', (int) $id)
                  ->orWhere('universe_b_id', (int) $id);
            })
            ->orderByDesc('created_at')
            ->get();
        return response()->json($interactions);
    })->name('worldos.universes.interactions');

    Route::get('universes/{id}/causal-trajectories', function (string $id) {
        $trajectories = CausalTrajectory::where('universe_id', (int) $id)
            ->where('is_fulfilled', false)
            ->orderBy('target_tick', 'asc')
            ->get();
        return response()->json(['data' => $trajectories]);
    })->name('worldos.universes.causal-trajectories');

    Route::get('scenarios', function (ScenarioEngine $engine) {
        return response()->json($engine->getScenarioList());
    })->name('worldos.scenarios.list');

    Route::get('universes/{id}/evaluate', function (string $id, UniverseSnapshotRepository $repo, UniverseEvaluatorInterface $evaluator) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        }
        $result = $evaluator->evaluate($snapshot);
        return response()->json($result);
    })->name('worldos.universes.evaluate');

    Route::get('universes/{id}/material-dag', [MaterialMutationController::class, 'getDagData'])
        ->name('worldos.universes.material-dag');

    Route::get('universes/{id}/history-timeline', function (string $id) {
        $events = BranchEvent::where('universe_id', (int) $id)->orderBy('from_tick')->get();
        return response()->json($events);
    })->name('worldos.universes.history-timeline');

    Route::get('universes/{id}/society-metrics', function (string $id, UniverseRepositoryInterface $universeRepo) {
        $universe = $universeRepo->find((int) $id);
        if (!$universe) return response()->json(['error' => 'Universe not found'], 404);
        $sv = $universe->state_vector;
        if (is_string($sv)) $sv = json_decode($sv, true) ?: [];
        $civ = is_array($sv) ? ($sv['civilization'] ?? []) : [];
        return response()->json([
            'current_tick' => $universe->current_tick ?? 0,
            'settlements' => $civ['settlements'] ?? [],
            'total_population' => $civ['total_population'] ?? 0,
            'economy' => $civ['economy'] ?? null,
            'politics' => $civ['politics'] ?? null,
            'war' => $civ['war'] ?? null,
        ]);
    })->name('worldos.universes.society-metrics');

    Route::get('universes/{id}/environment-metrics', function (string $id, UniverseRepositoryInterface $universeRepo) {
        $universe = $universeRepo->find((int) $id);
        if (!$universe) return response()->json(['error' => 'Universe not found'], 404);
        $sv = $universe->state_vector;
        if (is_string($sv)) $sv = json_decode($sv, true) ?: [];
        $zones = is_array($sv) ? ($sv['zones'] ?? []) : [];
        $out = ['current_tick' => $universe->current_tick ?? 0, 'zones' => []];
        foreach ($zones as $idx => $zone) {
            $state = $zone['state'] ?? $zone;
            $out['zones'][] = [
                'id' => $zone['id'] ?? $idx,
                'temperature' => isset($state['temperature']) ? round((float) $state['temperature'], 4) : null,
                'rainfall' => isset($state['rainfall']) ? round((float) $state['rainfall'], 4) : null,
                'ecosystem_state' => $state['ecosystem_state'] ?? null,
                'terrain_type' => $state['terrain_type'] ?? null,
            ];
        }
        return response()->json($out);
    })->name('worldos.universes.environment-metrics');

    Route::get('universes/{id}/topology', function (string $id, GetUniverseTopologyAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.topology');

    Route::post('universes/{id}/fork', function (string $id, ImplicitOrchestratorService $orchestrator) {
        $tick = (int) request()->input('tick', 0);
        $universe = Universe::findOrFail((int) $id);
        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick > 0 ? $tick : (int) $universe->current_tick,
            'event_type' => 'fork',
            'payload' => ['manual' => true],
        ]);
        $child = $orchestrator->spawnUniverse($universe->world, $universe->id, $universe->saga_id);
        return response()->json(['ok' => true, 'child_universe_id' => $child->id]);
    })->name('worldos.universes.fork');

    Route::post('universes/{id}/inject', function (string $id) {
        $universe = Universe::findOrFail((int) $id);
        $materialSlug = request()->input('material', 'unstable_reactor');
        $amount = (int) request()->input('amount', 10);
        $material = Material::firstOrCreate(['slug' => $materialSlug], ['name' => ucfirst($materialSlug), 'ontology' => 'matter']);
        MaterialInstance::create([
            'universe_id' => $universe->id,
            'material_id' => $material->id,
            'quantity' => $amount,
            'lifecycle' => 'active'
        ]);
        return response()->json(['ok' => true]);
    })->name('worldos.universes.inject');

    Route::post('demo/seed', function (ImplicitOrchestratorService $orchestrator) {
        $multiverse = \App\Modules\Simulation\Models\Multiverse::firstOrCreate(['slug' => 'default'], ['name' => 'Default']);
        $world = World::firstOrCreate(['slug' => 'default-world'], [
            'multiverse_id' => $multiverse->id,
            'name' => 'Default World',
            'current_genre' => 'urban',
            'base_genre' => 'urban',
            'is_autonomic' => true,
        ]);
        $universe = $orchestrator->spawnUniverse($world);
        return response()->json(['ok' => true, 'universe_id' => $universe->id]);
    })->name('worldos.demo.seed');

    Route::post('simulation/advance', function (AdvanceSimulationAction $action) {
        $universeId = (int) request()->input('universe_id', 0);
        $ticks = (int) request()->input('ticks', 1);
        return response()->json($action->execute($universeId, $ticks));
    })->name('worldos.simulation.advance');

    Route::post('worlds/{id}/pulse', function (string $id, PulseWorldAction $action) {
        $world = World::findOrFail((int) $id);
        return response()->json(['ok' => true, 'results' => $action->execute($world, (int) request()->input('ticks_per_universe', 5))]);
    })->name('worldos.worlds.pulse');

    Route::post('worlds/{id}/toggle-autonomic', function (string $id) {
        $world = World::findOrFail((int) $id);
        $world->is_autonomic = ! $world->is_autonomic;
        $world->save();
        return response()->json(['ok' => true, 'is_autonomic' => $world->is_autonomic]);
    })->name('worldos.worlds.toggle-autonomic');

    Route::post('worlds/{id}/axiom', function (string $id, WorldAxiomAction $action) {
        $world = World::findOrFail((int) $id);
        return response()->json($action->execute($world, request()->input('axioms', [])));
    })->name('worldos.worlds.axiom');

    Route::get('worlds/{id}/export', function (string $id, ExportWorldAction $action) {
        return response()->json($action->execute($id));
    })->name('worldos.worlds.export');

    Route::post('worlds/import', function (ImportWorldAction $action) {
        return response()->json($action->execute(request()->all()), 201);
    })->name('worldos.worlds.import');



    Route::get('multiverse/map', [MultiverseMapController::class, 'bloom'])
        ->name('worldos.multiverse.map');

    Route::get('universes/{id}/graph', [UniverseGraphController::class, 'show'])
        ->name('worldos.universes.graph');

    Route::get('observer/stream', [ObserverDashboardController::class, 'getStream'])
        ->name('worldos.observer.stream');
});

Route::middleware('auth:sanctum')->prefix('ip-factory')->group(function () {
    Route::get('presets', [IpFactoryController::class, 'presets']);
    Route::post('merge', [IpFactoryController::class, 'merge']);
    Route::get('registry', [IpFactoryController::class, 'registry']);
});


