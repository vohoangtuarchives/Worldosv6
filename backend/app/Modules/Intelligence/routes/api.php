<?php

use App\Modules\Intelligence\Http\Controllers\AuthController;
use App\Modules\Intelligence\Http\Controllers\AgentConfigController;
use App\Modules\Intelligence\Http\Controllers\ApexController;
use App\Modules\Intelligence\Http\Controllers\DashboardController;
use App\Modules\Intelligence\Http\Controllers\ObserverDashboardController;
use App\Modules\Intelligence\Models\LegendaryAgent;
use App\Modules\Intelligence\Models\Actor;
use App\Modules\Intelligence\Models\ActorEvent;
use App\Modules\Intelligence\Models\AgentDecision;
use App\Modules\Intelligence\Models\SupremeEntity;
use App\Modules\Intelligence\Actions\GetUniverseActorsAction;
use App\Modules\Intelligence\Actions\DecideUniverseAction;
use App\Modules\Intelligence\Services\BiologyMetricsService;
use App\Modules\Intelligence\Services\EcosystemMetricsService;
use App\Modules\Intelligence\Services\AI\AnalyticalAiService;
use App\Modules\Intelligence\Services\AI\SearchAiService;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    Route::get('/agent-config', [AgentConfigController::class, 'show']);
    Route::post('/agent-config', [AgentConfigController::class, 'store']);

    Route::post('universes/{id}/apex/command', [ApexController::class, 'command'])->name('worldos.universes.apex');

    Route::get('universes/{id}/supreme-entities', function (string $id) {
        $entities = SupremeEntity::where('universe_id', (int) $id)
            ->orderBy('entity_type')
            ->orderByDesc('power_level')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.supreme-entities');

    Route::get('universes/{id}/great-persons', function (string $id) {
        $entities = SupremeEntity::where('universe_id', (int) $id)
            ->where('entity_type', 'like', 'great_person_%')
            ->orderBy('entity_type')
            ->orderByDesc('power_level')
            ->get();
        return response()->json($entities);
    })->name('worldos.universes.great-persons');

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

    Route::get('universes/{id}/actors', function (string $id, GetUniverseActorsAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.actors');

    Route::get('actors/{actorId}/events', function (string $actorId) {
        $events = ActorEvent::where('actor_id', (int) $actorId)->orderBy('tick')->get();
        return response()->json($events);
    })->name('worldos.actors.events');

    Route::get('actors/{id}', function (string $id) {
        $actor = Actor::with('supremeEntity')->find((int)$id);
        if (!$actor) {
            return response()->json(['message' => 'Actor not found'], 404);
        }
        return response()->json($actor);
    })->name('worldos.actors.show');

    Route::get('universes/{id}/biology-metrics', function (
        string $id,
        BiologyMetricsService $service,
        EcosystemMetricsService $ecosystemService,
        UniverseRepositoryInterface $universeRepo
    ) {
        $universeId = (int) $id;
        $data = $service->forUniverse($universeId);
        $universe = $universeRepo->find($universeId);
        if ($universe) {
            $eco = $ecosystemService->forUniverse($universe);
            $data['instability_score'] = $eco['instability_score'];
            $sv = $universe->state_vector;
            if (is_string($sv)) {
                $sv = json_decode($sv, true) ?: [];
            }
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

    Route::get('actors/{id}/decisions', function (string $id) {
        $decisions = AgentDecision::where('actor_id', (int) $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();
        return response()->json($decisions);
    })->name('worldos.actors.decisions');

    Route::post('universes/{id}/decide', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        }
        $result = $action->execute($snapshot);
        return response()->json($result);
    })->name('worldos.universes.decide');

    Route::get('analysis/patterns', function (AnalyticalAiService $ai) {
        $ids = \App\Modules\Simulation\Models\Universe::pluck('id')->all();
        $result = $ai->analyze($ids, (int) request()->query('limit', 50));
        return response()->json($result);
    })->name('worldos.analysis.patterns');

    Route::get('universes/{id}/search/mutations', function (string $id, SearchAiService $search) {
        $params = [];
        $result = $search->suggestMutations($params);
        return response()->json($result);
    })->name('worldos.universes.search.mutations');

    Route::get('legends', function () {
        return response()->json(LegendaryAgent::with('universe:id,name')->orderByDesc('tick_discovered')->get());
    })->name('worldos.legends.index');

    Route::get('observer/dashboard', [ObserverDashboardController::class, 'getStatus'])
        ->name('worldos.observer.dashboard');

    Route::group(['prefix' => 'lab/dashboard'], function () {
        Route::get('state', [DashboardController::class, 'state'])->name('worldos.lab.dashboard.state');
        Route::get('attractors', [DashboardController::class, 'attractors'])->name('worldos.lab.dashboard.attractors');
        Route::get('evolution', [DashboardController::class, 'evolution'])->name('worldos.lab.dashboard.evolution');
        Route::get('risks', [DashboardController::class, 'risks'])->name('worldos.lab.dashboard.risks');
        Route::get('intelligence', [DashboardController::class, 'intelligence'])->name('worldos.lab.dashboard.intelligence');
        Route::post('intervene', [DashboardController::class, 'intervene'])->name('worldos.lab.dashboard.intervene');
    });
});
