<?php

use App\Models\Universe;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Simulation\UniverseRuntimeService; // keep for now just in case
use App\Actions\Simulation\AdvanceSimulationAction;
use App\Actions\Simulation\DecideUniverseAction;
use App\Services\Saga\SagaService;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Contracts\UniverseEvaluatorInterface;
use App\Services\AI\AnalyticalAiService;
use App\Services\AI\SearchAiService;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AgentConfigController;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    Route::get('/agent-config', [AgentConfigController::class, 'show']);
    Route::post('/agent-config', [AgentConfigController::class, 'store']);

    // Saga index/store routes removed (Implicit Orchestration)

    Route::get('worlds', function () {
        $worlds = \App\Models\World::with('multiverse:id,name')->get(['id', 'multiverse_id', 'name', 'slug', 'current_genre', 'base_genre']);
        return response()->json($worlds);
    })->name('worldos.worlds.index');

    Route::post('worlds', function (SagaService $sagaService) {
        $name = request()->input('name');
        $description = request()->input('description', '');
        $axioms = request()->input('axioms', []);
        $genre = request()->input('genre', 'wuxia');
        
        if (empty($name)) {
            return response()->json(['ok' => false, 'error' => 'name required'], 422);
        }
        
        $multiverse = \App\Models\Multiverse::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Prime Multiverse']
        );
        
        $world = \App\Models\World::create([
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

        // Auto-spawn Universe (Saga created implicitly by service if needed)
        $universe = $sagaService->spawnUniverse($world);
        
        return response()->json([
            'ok' => true, 
            'world' => $world,
            'universe_id' => $universe->id
        ]);
    })->name('worldos.worlds.store');

    // POST worldos/sagas removed (Implicit Orchestration)

    Route::get('universes', function () {
        $query = Universe::with(['world:id,name,slug,current_genre,base_genre', 'saga:id,name']);
        if (request()->has('world_id')) {
            $query->where('world_id', (int) request('world_id'));
        } elseif (request()->has('saga_id')) {
            $query->where('saga_id', (int) request('saga_id'));
        }
        return response()->json($query->get());
    })->name('worldos.universes.index');

    Route::get('universes/{id}', function (string $id) {
        $universe = Universe::with(['world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic', 'saga:id,name'])->findOrFail((int) $id);
        return response()->json($universe);
    })->name('worldos.universes.show');

    Route::get('universes/{id}/snapshot', function (string $id, UniverseSnapshotRepository $repo) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'No snapshot found'], 404);
        }
        return response()->json($snapshot);
    })->name('worldos.universes.snapshot');

    Route::get('universes/{id}/snapshots', function (string $id) {
        $limit = (int) request()->query('limit', 50);
        $limit = $limit > 0 && $limit <= 500 ? $limit : 50;
        $rows = \App\Models\UniverseSnapshot::where('universe_id', (int) $id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get(['id', 'universe_id', 'tick', 'entropy', 'stability_index', 'metrics'])
            ->toArray();
        return response()->json(array_reverse($rows));
    })->name('worldos.universes.snapshots');

    Route::get('universes/{id}/chronicles', function (string $id) {
        $limit = request()->input('limit', 10);
        $chronicles = \App\Models\Chronicle::where('universe_id', (int) $id)
            ->orderByDesc('to_tick')
            ->paginate((int)$limit);
        return response()->json($chronicles);
    })->name('worldos.universes.chronicles');

    Route::get('universes/{id}/materials', function (string $id) {
        $materials = \App\Models\MaterialInstance::with('material:id,name,ontology,description')
            ->where('universe_id', (int) $id)
            ->where('lifecycle', 'active')
            ->get();
        return response()->json($materials);
    })->name('worldos.universes.materials');

    Route::get('universes/{id}/branch-events', function (string $id) {
        $events = \App\Models\BranchEvent::where('universe_id', (int) $id)
            ->orderByDesc('from_tick')
            ->get();
        return response()->json($events);
    })->name('worldos.universes.branch-events');

    Route::get('universes/{id}/social-contracts', function (string $id) {
        $contracts = \App\Models\SocialContract::where('universe_id', (int) $id)
            ->orderByDesc('created_at')
            ->get();
        return response()->json($contracts);
    })->name('worldos.universes.social-contracts');

    Route::get('universes/{id}/supreme-entities', function (string $id) {
        $entities = \App\Models\SupremeEntity::where('universe_id', (int) $id)
            ->orderBy('entity_type')
            ->orderByDesc('power_level')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.supreme-entities');

    Route::get('universes/{id}/institutional-entities', function (string $id) {
        $entities = \App\Models\InstitutionalEntity::where('universe_id', (int) $id)
            ->whereNull('collapsed_at_tick')
            ->orderByDesc('org_capacity')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.institutional-entities');

    Route::get('edicts', function (\App\Services\Simulation\WorldEdictEngine $engine) {
        return response()->json($engine->getEdictDictionary());
    })->name('worldos.edicts.list');

    Route::post('universes/{id}/decree', function (string $id, \Illuminate\Http\Request $request, \App\Actions\Simulation\DecreeUniverseAction $action) {
        $universe = \App\Models\Universe::findOrFail((int) $id);
        $edictId = $request->input('edict_id');
        $result = $action->execute($universe, $edictId);
        
        if ($result['ok']) {
            return response()->json(['message' => 'Edict decreed successfully']);
        }
        return response()->json($result, 400);
    })->name('worldos.universes.decree');

    Route::get('scenarios', function (\App\Services\Simulation\ScenarioEngine $engine) {
        return response()->json($engine->getScenarioList());
    })->name('worldos.scenarios.list');

    Route::post('universes/{id}/scenario', function (string $id, \Illuminate\Http\Request $request, \App\Actions\Simulation\LaunchScenarioAction $action) {
        $universe = \App\Models\Universe::findOrFail((int) $id);
        $scenarioId = $request->input('scenario_id');
        $result = $action->execute($universe, $scenarioId);
        
        if ($result['ok']) {
            return response()->json($result);
        }
        return response()->json($result, 400);
    })->name('worldos.universes.scenario.launch');

    Route::get('universes/{id}/evaluate', function (string $id, UniverseSnapshotRepository $repo, UniverseEvaluatorInterface $evaluator) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'No snapshot found'], 404);
        }
        $result = $evaluator->evaluate($snapshot);
        return response()->json($result);
    })->name('worldos.universes.evaluate');

    Route::get('universes/{id}/material-dag', [\App\Http\Controllers\Api\MaterialMutationController::class, 'getDagData'])
        ->name('worldos.universes.material-dag');

    Route::get('universes/{id}/myth-scars', [\App\Http\Controllers\Api\MythScarController::class, 'index'])
        ->name('worldos.universes.myth-scars');

    Route::get('universes/{id}/actors', function (string $id, \App\Actions\Simulation\GetUniverseActorsAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.actors');

    Route::get('actors/{id}/decisions', function (string $id) {
        $decisions = \App\Models\AgentDecision::where('actor_id', (int) $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();
        return response()->json($decisions);
    })->name('worldos.actors.decisions');

    Route::get('universes/{id}/topology', function (string $id, \App\Actions\Simulation\GetUniverseTopologyAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.topology');

    Route::post('universes/{id}/decide', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'No snapshot found'], 404);
        }
        $result = $action->execute($snapshot);
        return response()->json($result);
    })->name('worldos.universes.decide');
    Route::post('universes/{id}/fork', function (string $id, SagaService $sagaService) {
        $tick = (int) request()->input('tick', 0);
        $universe = \App\Models\Universe::findOrFail((int) $id);
        \App\Models\BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick > 0 ? $tick : (int) $universe->current_tick,
            'event_type' => 'fork',
            'payload' => ['manual' => true],
        ]);
        $child = $sagaService->spawnUniverse($universe->world, $universe->id, $universe->saga_id);
        return response()->json(['ok' => true, 'child_universe_id' => $child->id]);
    })->name('worldos.universes.fork');

    Route::post('universes/{id}/inject', function (string $id) {
        $universe = Universe::findOrFail((int) $id);
        $materialSlug = request()->input('material', 'unstable_reactor');
        $amount = (int) request()->input('amount', 10);
        
        $material = \App\Models\Material::where('slug', $materialSlug)->first();
        if (!$material) {
             $material = \App\Models\Material::firstOrCreate(
                 ['slug' => $materialSlug],
                 ['name' => ucfirst(str_replace('_', ' ', $materialSlug)), 'ontology' => 'matter']
             );
        }
        
        \App\Models\MaterialInstance::create([
            'universe_id' => $universe->id,
            'material_id' => $material->id,
            'quantity' => $amount,
            'location' => ['x' => 0, 'y' => 0, 'z' => 0],
            'lifecycle' => 'active'
        ]);
        
        return response()->json(['ok' => true]);
    })->name('worldos.universes.inject');

    Route::post('demo/seed', function (SagaService $sagaService) {
        $multiverse = \App\Models\Multiverse::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Default Multiverse', 'config' => ['description' => 'WorldOS V6 demo']]
        );
        $world = \App\Models\World::firstOrCreate(
            ['slug' => 'default-world'],
            [
                'multiverse_id' => $multiverse->id,
                'name' => 'Default World',
                'axiom' => ['entropy_conservation' => true, 'material_organization' => true],
                'world_seed' => ['archetypes' => []],
                'origin' => 'Vietnamese',
                'current_genre' => 'urban',
                'base_genre' => 'urban',
            ]
        );
        // Auto-spawn Universe (Saga created implicitly)
        $universe = $sagaService->spawnUniverse($world);

        return response()->json([
            'ok' => true,
            'universe_id' => $universe->id,
        ]);
    })->name('worldos.demo.seed');

    Route::post('simulation/advance', function (AdvanceSimulationAction $action) {
        $universeId = (int) request()->input('universe_id', 0);
        $ticks = (int) request()->input('ticks', 1);
        if ($universeId < 1 || $ticks < 1) {
            return response()->json(['ok' => false, 'error' => 'universe_id and ticks required'], 422);
        }
        $result = $action->execute($universeId, $ticks);
        return response()->json($result);
    })->name('worldos.simulation.advance');

    Route::post('worlds/{id}/pulse', function (string $id, \App\Actions\Simulation\PulseWorldAction $action) {
        $world = \App\Models\World::findOrFail((int) $id);
        $ticks = (int) request()->input('ticks_per_universe', 5);
        $results = $action->execute($world, $ticks);
        return response()->json(['ok' => true, 'results' => $results]);
    })->name('worldos.worlds.pulse');

    Route::post('worlds/{id}/toggle-autonomic', function (string $id) {
        $world = \App\Models\World::findOrFail((int) $id);
        $world->is_autonomic = ! $world->is_autonomic;
        $world->save();
        return response()->json(['ok' => true, 'is_autonomic' => $world->is_autonomic]);
    })->name('worldos.worlds.toggle-autonomic');

    Route::post('worlds/{id}/axiom', function (string $id, \Illuminate\Http\Request $request, \App\Actions\Simulation\WorldAxiomAction $action) {
        $world = \App\Models\World::findOrFail((int) $id);
        $axioms = $request->input('axioms', []);
        $result = $action->execute($world, $axioms);
        return response()->json($result);
    })->name('worldos.worlds.axiom');

    // Legacy Saga Routes (DEPRECATED - No ticking allowed here)
    // saga/run-batch and saga/genesis-v3 removed as they represent archaic saga-centric ticking

    Route::get('sse/universe/{id}', function (string $id, UniverseSnapshotRepository $repo) {
        $response = new StreamedResponse(function () use ($id, $repo) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('Access-Control-Allow-Origin: *');
            $lastTick = null;
            while (true) {
                $snapshot = $repo->getLatest((int) $id);
                if ($snapshot && $snapshot->tick !== $lastTick) {
                    $lastTick = $snapshot->tick;
                    $payload = json_encode([
                        'tick' => $snapshot->tick,
                        'entropy' => $snapshot->entropy,
                        'stability_index' => $snapshot->stability_index,
                        'metrics' => $snapshot->metrics,
                    ]);
                    echo "data: {$payload}\n\n";
                    @ob_flush();
                    flush();
                }
                usleep(500000);
            }
        });
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    })->name('worldos.sse.universe');
    Route::get('universes/{id}/stream', function (string $id, UniverseSnapshotRepository $repo) {
        $response = new StreamedResponse(function () use ($id, $repo) {
            header('Content-Type: text/event-stream');
            header('Cache-Control', 'no-cache');
            header('Connection', 'keep-alive');
            header('Access-Control-Allow-Origin', '*');
            $lastTick = null;
            while (true) {
                $snapshot = $repo->getLatest((int) $id);
                if ($snapshot && $snapshot->tick !== $lastTick) {
                    $lastTick = $snapshot->tick;
                    $payload = json_encode([
                        'tick' => $snapshot->tick,
                        'entropy' => $snapshot->entropy,
                        'stability_index' => $snapshot->stability_index,
                        'metrics' => $snapshot->metrics,
                    ]);
                    echo "data: {$payload}\n\n";
                    @ob_flush();
                    flush();
                }
                usleep(500000);
            }
        });
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    })->name('worldos.universes.stream');

    Route::get('analysis/patterns', function (AnalyticalAiService $ai) {
        $ids = \App\Models\Universe::pluck('id')->all();
        $result = $ai->analyze($ids, (int) request()->query('limit', 50));
        return response()->json($result);
    })->name('worldos.analysis.patterns');
    Route::get('universes/{id}/search/mutations', function (string $id, SearchAiService $search) {
        $params = [];
        $result = $search->suggestMutations($params);
        return response()->json($result);
    })->name('worldos.universes.search.mutations');

    Route::get('universes/{id}/search', function (string $id, \App\Actions\Simulation\SearchChronicleAction $action) {
        $query = request()->query('q', '');
        return response()->json($action->execute((int)$id, $query));
    })->name('worldos.universes.search');

    Route::get('multiverse/tree', function (\App\Actions\Simulation\GetMultiverseTreeAction $action) {
        $universeId = request()->query('universe_id');
        $universe = \App\Models\Universe::find($universeId);
        if (!$universe) return response()->json([]);
        return response()->json($action->execute($universe->world_id));
    })->name('worldos.multiverse.tree');
});
