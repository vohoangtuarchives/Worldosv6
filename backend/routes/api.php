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
use App\Http\Controllers\Api\MultiverseMapController;
use App\Http\Controllers\Api\WorldosEnginesController;
use App\Http\Controllers\Api\CelestialEngineeringController;
use App\Models\LegendaryAgent;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

// Kiểm tra ghi log: GET /api/log-test (không cần auth). Gọi xong xem storage/logs/laravel.log
Route::get('/log-test', function () {
    $path = storage_path('logs/laravel.log');
    \Illuminate\Support\Facades\Log::channel('single')->info('LOG-TEST: Laravel đã ghi log thành công.');
    @file_put_contents($path, '[' . date('Y-m-d H:i:s') . '] local.INFO: LOG-TEST: Laravel đã ghi log thành công.' . "\n", FILE_APPEND);
    return response()->json([
        'ok' => true,
        'message' => 'Đã ghi log. Kiểm tra file bên dưới.',
        'log_path' => $path,
    ]);
});

// Xem nội dung log (dòng cuối, để kiểm tra không cần SSH): GET /api/log-view
Route::get('/log-view', function () {
    $path = storage_path('logs/laravel.log');
    $maxLines = (int) request()->input('lines', 100);
    $maxLines = min(max(1, $maxLines), 500);
    if (!is_file($path)) {
        return response()->json(['ok' => false, 'log_path' => $path, 'content' => null, 'message' => 'File log chưa tồn tại.']);
    }
    $content = file_get_contents($path);
    $lines = explode("\n", $content);
    $last = array_slice($lines, -$maxLines);
    return response()->json([
        'ok' => true,
        'log_path' => $path,
        'lines' => count($last),
        'content' => implode("\n", $last),
    ]);
});

// Phase 124: Bloom UI DAG Data (Public Endpoint)
Route::get('/bloom/multiverse', [MultiverseMapController::class, 'bloom'])->name('worldos.bloom.multiverse.public');

// Public reader API (no auth) - One IP / published series
Route::prefix('public/series')->group(function () {
    Route::get('{slug}', [\App\Http\Controllers\Api\PublicSeriesController::class, 'show']);
    Route::get('{slug}/chapters', [\App\Http\Controllers\Api\PublicSeriesController::class, 'chapters']);
    Route::get('{slug}/chapters/{chapter}', [\App\Http\Controllers\Api\PublicSeriesController::class, 'chapter']);
    Route::get('{slug}/bible', [\App\Http\Controllers\Api\PublicSeriesController::class, 'bible']);
});

/*
|--------------------------------------------------------------------------
| SCRIPTORIUM BRIDGE API (V24) - Public/Internal Access
|--------------------------------------------------------------------------
*/
Route::prefix('loom/v1/narrative')->group(function () {
    Route::get('chronicles', [\App\Http\Controllers\Api\Loom\LoomChronicleController::class, 'index']);
    Route::get('characters/{character_id}', [\App\Http\Controllers\Api\Loom\LoomCharacterController::class, 'show']);
    Route::get('state-snapshot/{world_id}', [\App\Http\Controllers\Api\Loom\LoomWorldStateController::class, 'show']);
});

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

    Route::get('worlds/{id}/ip', function (string $id) {
        $world = \App\Models\World::findOrFail((int) $id);
        $universes = $world->universes()->get(['id', 'name', 'world_id']);
        $universeIds = $universes->pluck('id')->toArray();
        $series = \App\Models\NarrativeSeries::with(['chapters' => fn ($q) => $q->orderBy('chapter_index')])
            ->whereIn('universe_id', $universeIds)
            ->get();
        $chronicles = \App\Models\Chronicle::whereIn('universe_id', $universeIds)
            ->orderByDesc('to_tick')
            ->limit(100)
            ->get(['id', 'universe_id', 'from_tick', 'to_tick', 'content', 'type', 'created_at']);
        $bibles = \App\Models\StoryBible::whereIn('series_id', $series->pluck('id'))->get();
        $characters = [];
        $lore = [];
        foreach ($bibles as $bible) {
            foreach ($bible->characters ?? [] as $c) {
                $characters[] = array_merge($c, ['_series_id' => $bible->series_id]);
            }
            foreach ($bible->lore ?? [] as $l) {
                $lore[] = array_merge(is_array($l) ? $l : ['text' => $l], ['_series_id' => $bible->series_id]);
            }
        }
        return response()->json([
            'world' => $world->only(['id', 'name', 'slug', 'current_genre', 'base_genre']),
            'universes' => $universes->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'series' => $series->where('universe_id', $u->id)->values()->toArray(),
                'chronicles' => $chronicles->where('universe_id', $u->id)->values()->toArray(),
            ])->toArray(),
            'aggregated_bibles' => [
                'characters' => $characters,
                'lore' => $lore,
            ],
        ]);
    })->name('worldos.worlds.ip');

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

    // --- WorldOS Engines API (Phase J) ---
    Route::get('worlds/{id}/timelines', [WorldosEnginesController::class, 'worldTimelines'])->name('worldos.worlds.timelines');
    Route::post('worlds/{id}/extract-lore', [WorldosEnginesController::class, 'worldExtractLore'])->name('worldos.worlds.extract-lore');
    Route::get('sagas/{id}/timelines', [WorldosEnginesController::class, 'sagaTimelines'])->name('worldos.sagas.timelines');
    Route::post('sagas/{id}/extract-lore', [WorldosEnginesController::class, 'sagaExtractLore'])->name('worldos.sagas.extract-lore');
    Route::get('universes/{id}/civilization-memory', [WorldosEnginesController::class, 'civilizationMemory'])->name('worldos.universes.civilization-memory');
    Route::post('universes/{id}/mythology', [WorldosEnginesController::class, 'mythology'])->name('worldos.universes.mythology');
    Route::get('universes/{id}/ideology', [WorldosEnginesController::class, 'ideology'])->name('worldos.universes.ideology');
    Route::post('universes/{id}/great-person', [WorldosEnginesController::class, 'greatPerson'])->name('worldos.universes.great-person');
    Route::get('engines', [WorldosEnginesController::class, 'index'])->name('worldos.engines');
    Route::get('engines/status', [WorldosEnginesController::class, 'status'])->name('worldos.engines.status');

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

    Route::post('universes/{id}/generate-chronicle', function (string $id, \Illuminate\Http\Request $request, \App\Services\Narrative\NarrativeAiService $narrativeAi) {
        $universeId = (int) $id;
        $universe = \App\Models\Universe::findOrFail($universeId);
        $fromTick = $request->input('from_tick');
        $toTick = $request->input('to_tick');
        if ($fromTick === null || $fromTick === '') {
            $first = $universe->snapshots()->orderBy('tick')->first();
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $fromTick = $first ? (int) $first->tick : 0;
            $toTick = $toTick !== null && $toTick !== '' ? (int) $toTick : ($latest ? (int) $latest->tick : $fromTick);
        } else {
            $fromTick = (int) $fromTick;
            if ($toTick !== null && $toTick !== '') {
                $toTick = (int) $toTick;
            } else {
                $latest = $universe->snapshots()->orderByDesc('tick')->first();
                $toTick = $latest ? (int) $latest->tick : $fromTick;
            }
        }
        $chronicle = $narrativeAi->generateChronicle($universeId, $fromTick, $toTick, 'chronicle');
        if (!$chronicle) {
            return response()->json(['message' => 'Không thể sinh sử thi.'], 422);
        }
        return response()->json([
            'data' => [
                'id' => $chronicle->id,
                'content' => $chronicle->content,
                'from_tick' => $chronicle->from_tick,
                'to_tick' => $chronicle->to_tick,
            ],
        ]);
    })->name('worldos.universes.generate-chronicle');

    // Narrative v2: AI Historian — generate history volume / essay from Historical Fact + timeline
    Route::post('universes/{id}/historian/generate', function (string $id, \Illuminate\Http\Request $request, \App\Services\Narrative\HistorianAgentService $historian) {
        $universe = \App\Models\Universe::findOrFail((int) $id);
        $outputType = $request->input('output_type', 'history_volume');
        $outputType = in_array($outputType, ['history_volume', 'historian_essay', 'philosophy_treatise'], true) ? $outputType : 'history_volume';
        $criteria = [
            'from_tick' => $request->has('from_tick') ? (int) $request->input('from_tick') : null,
            'to_tick' => $request->has('to_tick') ? (int) $request->input('to_tick') : null,
            'theme' => $request->input('theme', 'general'),
            'actor_id' => $request->has('actor_id') ? (int) $request->input('actor_id') : null,
        ];
        $chronicle = $historian->generateHistory($universe, $outputType, array_filter($criteria, fn ($v) => $v !== null));
        if (! $chronicle) {
            return response()->json(['message' => 'Historian generation failed or LLM unavailable.'], 422);
        }
        return response()->json([
            'data' => [
                'id' => $chronicle->id,
                'type' => $chronicle->type,
                'content' => $chronicle->content,
                'from_tick' => $chronicle->from_tick,
                'to_tick' => $chronicle->to_tick,
            ],
        ]);
    })->name('worldos.universes.historian.generate');

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

    Route::get('universes/{id}/great-persons', function (string $id) {
        $entities = \App\Models\SupremeEntity::where('universe_id', (int) $id)
            ->where('entity_type', 'like', 'great_person_%')
            ->orderBy('entity_type')
            ->orderByDesc('power_level')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.great-persons');

    Route::get('universes/{id}/institutional-entities', function (string $id) {
        $entities = \App\Models\InstitutionalEntity::where('universe_id', (int) $id)
            ->whereNull('collapsed_at_tick')
            ->orderByDesc('org_capacity')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.institutional-entities');

    Route::get('edicts', function (\App\Modules\Institutions\Services\WorldEdictEngine $engine) {
        return response()->json($engine->getEdictDictionary());
    })->name('worldos.edicts.list');

    Route::post('universes/{id}/decree', function (string $id, \Illuminate\Http\Request $request, \App\Actions\Simulation\DecreeUniverseAction $action) {
        $universe = \App\Models\Universe::findOrFail((int) $id);
        $edictId = $request->input('edict_id');
        $result = $action->execute($universe, $edictId);
        
        if ($result['ok']) {
            return response()->json(['message' => 'Đã ban hành sắc lệnh thành công']);
        }
        return response()->json($result, 400);
    })->name('worldos.universes.decree');

    Route::get('universes/{id}/interactions', function (string $id) {
        $interactions = \App\Models\UniverseInteraction::with(['universeA:id,name', 'universeB:id,name'])
            ->where(function($q) use ($id) {
                $q->where('universe_a_id', (int) $id)
                  ->orWhere('universe_b_id', (int) $id);
            })
            ->orderByDesc('created_at')
            ->get();
        return response()->json($interactions);
    })->name('worldos.universes.interactions');

    // --- Causal Trajectory & Event Horizons (Ph?n t?ch qu? d?o nh?n qu?) ---
    Route::get('universes/{id}/causal-trajectories', function (string $id) {
        $trajectories = \App\Models\CausalTrajectory::where('universe_id', (int) $id)
            ->where('is_fulfilled', false)
            ->orderBy('target_tick', 'asc')
            ->get();
        
        return response()->json(['data' => $trajectories]);
    })->name('worldos.universes.causal-trajectories');

    Route::get('scenarios', function (\App\Modules\Simulation\Services\ScenarioEngine $engine) {
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
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        }
        $result = $evaluator->evaluate($snapshot);
        return response()->json($result);
    })->name('worldos.universes.evaluate');

    Route::get('universes/{id}/decision-metrics', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $universeId = (int) $id;
        $snapshot = $repo->getLatest($universeId);
        if (! $snapshot) {
            return response()->json([
                'action' => 'observe',
                'navigator_score' => 0,
                'novelty' => null,
                'complexity' => null,
                'divergence' => null,
                'nearest_archetype' => null,
                'is_novel_archetype' => false,
            ]);
        }
        $result = $action->execute($snapshot);
        return response()->json([
            'action' => $result['action'],
            'navigator_score' => $result['navigator_score'],
            'novelty' => $result['meta']['novelty'] ?? null,
            'complexity' => $result['meta']['complexity'] ?? null,
            'divergence' => $result['meta']['divergence'] ?? null,
            'nearest_archetype' => $result['meta']['detected_archetype'] ?? null,
            'is_novel_archetype' => $result['meta']['is_novel_archetype'] ?? null,
        ]);
    })->name('worldos.universes.decision-metrics');

    Route::get('universes/{id}/material-dag', [\App\Http\Controllers\Api\MaterialMutationController::class, 'getDagData'])
        ->name('worldos.universes.material-dag');

    Route::get('universes/{id}/myth-scars', [\App\Http\Controllers\Api\MythScarController::class, 'index'])
        ->name('worldos.universes.myth-scars');

    Route::get('universes/{id}/actors', function (string $id, \App\Actions\Simulation\GetUniverseActorsAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.actors');

    Route::get('actors/{actorId}/events', function (string $actorId) {
        $events = \App\Models\ActorEvent::where('actor_id', (int) $actorId)->orderBy('tick')->get();
        return response()->json($events);
    })->name('worldos.actors.events');

    Route::get('universes/{id}/biology-metrics', function (
        string $id,
        \App\Modules\Intelligence\Services\BiologyMetricsService $service,
        \App\Modules\Intelligence\Services\EcosystemMetricsService $ecosystemService,
        \App\Contracts\Repositories\UniverseRepositoryInterface $universeRepo
    ) {
        $universeId = (int) $id;
        $data = $service->forUniverse($universeId);
        $universe = $universeRepo->find($universeId);
        if ($universe) {
            $eco = $ecosystemService->forUniverse($universe);
            $data['instability_score'] = $eco['instability_score'];
            $sv = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : ($universe->state_vector ?? []);
            $collapse = is_array($sv) ? ($sv['ecological_collapse'] ?? []) : [];
            $data['ecological_collapse_active'] = !empty($collapse['active']);
            $data['ecological_collapse_until_tick'] = $collapse['until_tick'] ?? null;
            $data['ecological_collapse_since_tick'] = $collapse['since_tick'] ?? null;
            $data['ecological_collapse_type'] = $collapse['type'] ?? null;
            $data['current_tick'] = $universe->current_tick ?? 0;
        } else {
            $data['instability_score'] = 0;
            $data['ecological_collapse_active'] = false;
            $data['ecological_collapse_until_tick'] = null;
            $data['ecological_collapse_since_tick'] = null;
            $data['ecological_collapse_type'] = null;
            $data['current_tick'] = 0;
        }
        return response()->json($data);
    })->name('worldos.universes.biology-metrics');

    Route::get('universes/{id}/history-timeline', function (
        string $id,
        \App\Contracts\Repositories\UniverseRepositoryInterface $universeRepo,
        \App\Services\Simulation\HistoryEngine $historyEngine
    ) {
        $universe = $universeRepo->find((int) $id);
        if (!$universe) {
            return response()->json(['error' => 'Universe not found'], 404);
        }
        $limit = (int) request()->query('limit', config('worldos.intelligence.history_timeline_limit', 100));
        return response()->json([
            'timeline' => $historyEngine->getTimeline($universe, $limit),
            'by_type' => $historyEngine->getTimelineByType($universe, $limit),
        ]);
    })->name('worldos.universes.history-timeline');

    Route::get('universes/{id}/society-metrics', function (
        string $id,
        \App\Contracts\Repositories\UniverseRepositoryInterface $universeRepo
    ) {
        $universe = $universeRepo->find((int) $id);
        if (!$universe) {
            return response()->json(['error' => 'Universe not found'], 404);
        }
        $sv = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : ($universe->state_vector ?? []);
        $civ = $sv['civilization'] ?? [];
        return response()->json([
            'current_tick' => $universe->current_tick ?? 0,
            'settlements' => $civ['settlements'] ?? [],
            'total_population' => $civ['total_population'] ?? 0,
            'economy' => $civ['economy'] ?? null,
            'politics' => $civ['politics'] ?? null,
            'war' => $civ['war'] ?? null,
        ]);
    })->name('worldos.universes.society-metrics');

    Route::get('universes/{id}/environment-metrics', function (
        string $id,
        \App\Contracts\Repositories\UniverseRepositoryInterface $universeRepo
    ) {
        $universe = $universeRepo->find((int) $id);
        if (!$universe) {
            return response()->json(['error' => 'Universe not found'], 404);
        }
        $sv = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : ($universe->state_vector ?? []);
        $zones = $sv['zones'] ?? [];
        $out = ['current_tick' => $universe->current_tick ?? 0, 'zones' => []];
        foreach ($zones as $idx => $zone) {
            $state = $zone['state'] ?? $zone;
            $out['zones'][] = [
                'id' => $zone['id'] ?? $idx,
                'temperature' => isset($state['temperature']) ? round((float) $state['temperature'], 4) : null,
                'rainfall' => isset($state['rainfall']) ? round((float) $state['rainfall'], 4) : null,
                'ecosystem_state' => $state['ecosystem_state'] ?? null,
                'target_ecosystem_state' => $state['target_ecosystem_state'] ?? null,
                'transition_progress' => isset($state['transition_progress']) ? round((float) $state['transition_progress'], 2) : null,
                'elevation' => isset($state['elevation']) ? round((float) $state['elevation'], 4) : null,
                'terrain_type' => $state['terrain_type'] ?? null,
                'mineral_richness' => isset($state['mineral_richness']) ? round((float) $state['mineral_richness'], 2) : null,
                'ice_coverage' => isset($state['ice_coverage']) ? round((float) $state['ice_coverage'], 2) : null,
            ];
        }
        return response()->json($out);
    })->name('worldos.universes.environment-metrics');

    Route::get('actors/{id}/decisions', function (string $id) {
        $decisions = \App\Models\AgentDecision::where('actor_id', (int) $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();
        return response()->json($decisions);
    })->name('worldos.actors.decisions');

    Route::get('universes/{id}/graph', [\App\Http\Controllers\Api\UniverseGraphController::class, 'show'])
        ->name('worldos.universes.graph');
    Route::get('universes/{id}/anomalies', [\App\Http\Controllers\Api\UniverseAnomalyController::class, 'index'])
        ->name('worldos.universes.anomalies');
    Route::get('universes/{id}/institutions', [\App\Http\Controllers\Api\UniverseInstitutionController::class, 'index'])
        ->name('worldos.universes.institutions');

    Route::get('universes/{id}/topology', function (string $id, \App\Actions\Simulation\GetUniverseTopologyAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.topology');

    Route::post('universes/{id}/decide', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
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
                'is_autonomic' => true,
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
        \Illuminate\Support\Facades\Log::info('Simulation: advance route hit', [
            'universe_id' => request()->input('universe_id'),
            'ticks' => request()->input('ticks'),
        ]);
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

    Route::get('worlds/{id}/simulation-status', function (string $id, \App\Modules\Simulation\Services\MultiverseSchedulerEngine $scheduler, \App\Services\Simulation\WorldSimulationStatusService $statusService) {
        $world = \App\Models\World::findOrFail((int) $id);
        return response()->json($statusService->getPayload($world, $scheduler));
    })->name('worldos.worlds.simulation-status');

    Route::get('worlds/{id}/simulation-status/stream', function (string $id, \App\Modules\Simulation\Services\MultiverseSchedulerEngine $scheduler, \App\Services\Simulation\WorldSimulationStatusService $statusService) {
        $world = \App\Models\World::findOrFail((int) $id);
        $response = new StreamedResponse(function () use ($world, $scheduler, $statusService) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('Access-Control-Allow-Origin: *');
            header('X-Accel-Buffering: no');
            while (!connection_aborted()) {
                $payload = $statusService->getPayload($world, $scheduler);
                echo 'data: ' . json_encode($payload) . "\n\n";
                if (ob_get_level()) {
                    @ob_flush();
                }
                flush();
                usleep(1500000);
            }
        });
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('X-Accel-Buffering', 'no');
        return $response;
    })->name('worldos.worlds.simulation-status.stream');

    Route::post('worlds/{id}/axiom', function (string $id, \Illuminate\Http\Request $request, \App\Actions\Simulation\WorldAxiomAction $action) {
        $world = \App\Models\World::findOrFail((int) $id);
        $axioms = $request->input('axioms', []);
        $result = $action->execute($world, $axioms);
        return response()->json($result);
    })->name('worldos.worlds.axiom');

    Route::get('worlds/{id}/export', function (string $id, \App\Actions\Simulation\ExportWorldAction $action) {
        return response()->json($action->execute($id));
    })->name('worldos.worlds.export');

    Route::post('worlds/import', function (\Illuminate\Http\Request $request, \App\Actions\Simulation\ImportWorldAction $action) {
        $world = $action->execute($request->all());
        return response()->json($world, 201);
    })->name('worldos.worlds.import');

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
        $universeId = (int) $id;
        $response = new StreamedResponse(function () use ($universeId, $repo) {
            header('Content-Type: text/event-stream');
            header('Cache-Control', 'no-cache');
            header('Connection', 'keep-alive');
            header('Access-Control-Allow-Origin', '*');
            $lastTick = null;
            while (true) {
                $universe = \App\Models\Universe::find($universeId);
                $snapshot = $repo->getLatest($universeId);
                $currentTick = $universe ? (int) $universe->current_tick : ($snapshot ? $snapshot->tick : 0);
                if ($snapshot && $snapshot->tick > $currentTick) {
                    $currentTick = $snapshot->tick;
                }
                if ($currentTick !== $lastTick) {
                    $lastTick = $currentTick;
                    $entropy = $snapshot?->entropy ?? ($universe && is_array($universe->state_vector) ? (float)($universe->state_vector['entropy'] ?? $universe->entropy) : null);
                    $stability = $snapshot?->stability_index ?? ($universe && is_array($universe->state_vector) ? ($universe->state_vector['stability_index'] ?? null) : null);
                    $metrics = $snapshot?->metrics ?? [];
                    $payload = json_encode([
                        'tick' => $currentTick,
                        'entropy' => $entropy,
                        'stability_index' => $stability,
                        'metrics' => $metrics,
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

    // Phase 69: Multiverse DAG Map (?V12)
    Route::get('multiverse/map', [MultiverseMapController::class, 'index'])
        ->name('worldos.multiverse.map');

    // Phase 69: Legendary Archive (?V12)
    Route::get('legends', function () {
        return response()->json(LegendaryAgent::with('universe:id,name')->orderByDesc('tick_discovered')->get());
    })->name('worldos.legends.index');

    // Phase 124 API mapping moved to public space

    // Phase 88: Observer Console (?V18)
    Route::get('observer/dashboard', [\App\Http\Controllers\Api\ObserverDashboardController::class, 'getStatus'])
        ->name('worldos.observer.dashboard');

    // Redis Streams: consume observer events (last_id, multiverse_id, count for long-poll)
    Route::get('observer/stream', function (\App\Services\Observer\ObserverService $observer) {
        $lastId = request()->query('last_id', '0');
        $multiverseId = request()->query('multiverse_id') ? (int) request()->query('multiverse_id') : null;
        $count = min(100, max(1, (int) request()->query('count', 50)));
        $entries = $observer->readStream($multiverseId, $lastId, $count);
        return response()->json(['entries' => $entries]);
    })->name('worldos.observer.stream');

    // SSE: push observer stream events (blocking Redis XREAD)
    Route::get('observer/stream/sse', function (\App\Services\Observer\ObserverService $observer) {
        $multiverseId = request()->query('multiverse_id') ? (int) request()->query('multiverse_id') : null;
        $lastId = request()->query('last_id', '0');
        $count = min(100, max(1, (int) request()->query('count', 50)));
        $blockMs = min(15000, max(1000, (int) request()->query('block_ms', 5000)));

        $response = new StreamedResponse(function () use ($observer, $multiverseId, &$lastId, $count, $blockMs) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('Access-Control-Allow-Origin: *');
            header('X-Accel-Buffering: no');
            $lastKeepalive = time();
            while (!connection_aborted()) {
                [$entries, $lastId] = $observer->readStreamBlocking($multiverseId, $lastId, $count, $blockMs);
                if (!empty($entries)) {
                    echo 'data: ' . json_encode(['entries' => $entries, 'last_id' => $lastId]) . "\n\n";
                    if (ob_get_level()) {
                        @ob_flush();
                    }
                    flush();
                }
                if (time() - $lastKeepalive >= 25) {
                    $lastKeepalive = time();
                    echo ": keepalive\n\n";
                    if (ob_get_level()) {
                        @ob_flush();
                    }
                    flush();
                }
            }
        });
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('X-Accel-Buffering', 'no');
        return $response;
    })->name('worldos.observer.stream.sse');

    // =========================================================================
    // Civilization Observatory Dashboard (Phase 7)
    // =========================================================================
    Route::prefix('lab/dashboard')->group(function () {
        Route::get('state', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'state'])->name('worldos.lab.dashboard.state');
        Route::get('attractors', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'attractors'])->name('worldos.lab.dashboard.attractors');
        Route::get('evolution', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'evolution'])->name('worldos.lab.dashboard.evolution');
        Route::get('risks', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'risks'])->name('worldos.lab.dashboard.risks');
        Route::get('intelligence', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'intelligence'])->name('worldos.lab.dashboard.intelligence');
        Route::post('intervene', [\App\Modules\Intelligence\Http\Controllers\DashboardController::class, 'intervene'])->name('worldos.lab.dashboard.intervene');
    });
    Route::post('narrative-studio/generate', function (
        \Illuminate\Http\Request $request,
        \App\Services\Narrative\NarrativeStudioService $studio
    ) {
        $payload = $request->validate([
            'universe_id' => ['required', 'integer', 'exists:universes,id'],
            'preset' => ['required', 'string', 'in:chronicle,story,beats'],
            'facts' => ['required', 'array', 'min:1'],
            'facts.*.id' => ['nullable', 'string'],
            'facts.*.tick' => ['nullable', 'integer'],
            'facts.*.title' => ['nullable', 'string'],
            'facts.*.summary' => ['nullable', 'string'],
            'facts.*.kind' => ['nullable', 'string'],
            'facts.*.severity' => ['nullable', 'string'],
            'facts.*.angle' => ['nullable', 'string'],
            'facts.*.evidence' => ['nullable', 'array'],
            'facts.*.evidence.*.label' => ['nullable', 'string'],
            'facts.*.evidence.*.value' => ['nullable', 'string'],
            'current_draft' => ['nullable', 'string'],
            'epic_chronicle' => ['nullable', 'string'],
        ]);

        $universe = \App\Models\Universe::with('world:id,name,current_genre,base_genre')
            ->findOrFail((int) $payload['universe_id']);

        $result = $studio->generateFromFacts(
            $universe,
            $payload['facts'],
            $payload['preset'],
            $payload['current_draft'] ?? null,
            $payload['epic_chronicle'] ?? null
        );

        return response()->json(['data' => $result]);
    })->name('worldos.narrative-studio.generate');

    // =========================================================================
    // IP Factory Pipeline
    // =========================================================================
    Route::prefix('ip-factory')->group(function () {
        Route::get('series', [\App\Http\Controllers\Api\IpFactoryController::class, 'index'])->name('ip-factory.series.index');
        Route::post('series', [\App\Http\Controllers\Api\IpFactoryController::class, 'store'])->name('ip-factory.series.store');
        Route::get('series/{series}', [\App\Http\Controllers\Api\IpFactoryController::class, 'show'])->name('ip-factory.series.show');
        Route::get('series/{series}/chapters', [\App\Http\Controllers\Api\IpFactoryController::class, 'chapters'])->name('ip-factory.series.chapters');
        Route::post('series/{series}/generate-chapter', [\App\Http\Controllers\Api\IpFactoryController::class, 'generateChapter'])->name('ip-factory.series.generate-chapter');
        Route::post('series/{series}/chapters/{chapter}/canonize', [\App\Http\Controllers\Api\IpFactoryController::class, 'canonize'])->name('ip-factory.series.chapters.canonize');
        Route::get('series/{series}/bible', [\App\Http\Controllers\Api\IpFactoryController::class, 'bible'])->name('ip-factory.series.bible');
        Route::put('series/{series}/publish', [\App\Http\Controllers\Api\IpFactoryController::class, 'publish'])->name('ip-factory.series.publish');
        Route::get('loom-status', [\App\Http\Controllers\Api\Loom\LoomStatusController::class, 'index'])->name('ip-factory.loom-status');
    });
});

