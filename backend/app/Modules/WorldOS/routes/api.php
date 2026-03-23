<?php

use Illuminate\Support\Facades\Route;
use App\Modules\WorldOS\Http\Controllers\UniverseController;
use App\Modules\WorldOS\Http\Controllers\NarrativeController;
use App\Modules\Simulation\Http\Controllers\RuleSetLibraryController;
use App\Modules\Simulation\Http\Controllers\VocationLibraryController;
use App\Modules\Simulation\Http\Controllers\UniverseAnomalyController;
use App\Modules\Simulation\Http\Controllers\MaterialMutationController;
use App\Modules\Simulation\Http\Controllers\UniverseGraphController;
use App\Modules\Simulation\Http\Controllers\WorldosEnginesController;
use App\Modules\Intelligence\Http\Controllers\ObserverDashboardController;
use App\Modules\Intelligence\Http\Controllers\ApexController;
use App\Modules\Intelligence\Http\Controllers\DashboardController;
use App\Modules\Narrative\Http\Controllers\MythScarController;
use App\Modules\Narrative\Http\Controllers\ZenithController;
use App\Modules\SocialGraph\Http\Controllers\UniverseInstitutionController;

// Models
use App\Models\Universe;
use App\Models\World;
use App\Models\Actor;
use App\Models\ActorEvent;
use App\Models\SupremeEntity;
use App\Models\AgentDecision;
use App\Models\Chronicle;
use App\Models\LegendaryAgent;
use App\Models\UniverseInteraction;
use App\Models\CausalTrajectory;

// Services & Actions
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use App\Modules\Intelligence\Actions\GetUniverseActorsAction;
use App\Modules\Intelligence\Actions\DecideUniverseAction;
use App\Modules\Intelligence\Services\BiologyMetricsService;
use App\Modules\Intelligence\Services\EcosystemMetricsService;
use App\Modules\Intelligence\Services\AI\AnalyticalAiService;
use App\Modules\Intelligence\Services\AI\SearchAiService;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Narrative\Services\UniverseHistoryGenerator;
use App\Modules\Narrative\Services\NarrativeAiService;
use App\Modules\Narrative\Services\ChronicleSynthesisEngine;
use App\Modules\Narrative\Actions\DecreeUniverseAction;
use App\Modules\Narrative\Actions\LaunchScenarioAction;

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    // 1. Core Universe Management
    Route::get('universes', [UniverseController::class, 'index'])->name('worldos.universes.index');
    Route::get('universes/{id}', [UniverseController::class, 'show'])->name('worldos.universes.show');
    Route::get('universes/{id}/snapshot', [UniverseController::class, 'snapshot'])->name('worldos.universes.snapshot');
    Route::get('universes/{id}/snapshots', [UniverseController::class, 'snapshots'])->name('worldos.universes.snapshots');
    Route::post('universes/{id}/fork', [UniverseController::class, 'fork'])->name('worldos.universes.fork');

    // 1.5 World Management & Missing Extended Routes
    Route::get('worlds', function() {
        return response()->json(World::with('universes')->get());
    })->name('worldos.worlds.index');
    Route::get('worlds/{id}/simulation-status', [UniverseController::class, 'status'])->name('worldos.worlds.status');
    Route::get('worlds/{id}/ip', [UniverseController::class, 'show'])->name('worldos.worlds.ip');

    Route::get('universes/{id}/graph', [UniverseGraphController::class, 'show'])->name('worldos.universes.graph');
    Route::get('universes/{id}/ideology', [WorldosEnginesController::class, 'ideology'])->name('worldos.universes.ideology');
    Route::get('universes/{id}/society-metrics', [WorldosEnginesController::class, 'stateSummary'])->name('worldos.universes.society-metrics');
    
    Route::get('universes/{id}/environment-metrics', function($id) {
        $u = Universe::findOrFail((int)$id);
        $sv = is_string($u->state_vector) ? json_decode($u->state_vector, true) : ($u->state_vector ?: []);
        return response()->json([
            'current_tick' => $u->current_tick,
            'zones' => $sv['zones'] ?? []
        ]);
    })->name('worldos.universes.environment-metrics');

    Route::get('universes/{id}/anomalies', [UniverseAnomalyController::class, 'index'])->name('worldos.universes.anomalies');
    Route::get('universes/{id}/materials', [MaterialMutationController::class, 'index'])->name('worldos.universes.materials');
    Route::get('universes/{id}/material-dag', [MaterialMutationController::class, 'index'])->name('worldos.universes.material-dag');
    
    Route::get('universes/{id}/interactions', function($id) {
        return response()->json(UniverseInteraction::where('universe_id', (int)$id)->latest()->take(50)->get());
    })->name('worldos.universes.interactions');

    Route::get('universes/{id}/causal-trajectories', function($id) {
        return response()->json(CausalTrajectory::where('universe_id', (int)$id)->get());
    })->name('worldos.universes.causal-trajectories');

    Route::get('universes/{id}/history-timeline', function(\Illuminate\Http\Request $request, $id) {
        $limit = (int) $request->query('limit', 50);
        $facts = \Illuminate\Support\Facades\DB::table('narrative_facts')
            ->where('universe_id', (int)$id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get();
        return response()->json([
            'timeline' => $facts,
            'by_type' => $facts->groupBy('type')
        ]);
    })->name('worldos.universes.history-timeline');

    // 2. Narrative & Chronicles
    Route::get('universes/{id}/chronicles', [NarrativeController::class, 'chronicles'])->name('worldos.universes.chronicles');
    Route::get('universes/{id}/myth-scars', [NarrativeController::class, 'mythScars'])->name('worldos.universes.myth-scars');
    Route::get('universes/{id}/artifacts', [NarrativeController::class, 'artifacts'])->name('worldos.universes.artifacts');
    Route::get('universes/{id}/zenith', [ZenithController::class, 'show'])->name('worldos.universes.zenith');

    Route::post('universes/{id}/generate-chronicle', function (string $id, \Illuminate\Http\Request $request, NarrativeAiService $narrativeAi) {
        $universeId = (int) $id;
        $universe = Universe::findOrFail($universeId);
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
        if (!$chronicle) return response()->json(['message' => 'Không thể sinh sử thi.'], 422);
        return response()->json(['data' => ['id' => $chronicle->id, 'content' => $chronicle->content, 'from_tick' => $chronicle->from_tick, 'to_tick' => $chronicle->to_tick]]);
    })->name('worldos.universes.generate-chronicle');

    Route::post('universes/{id}/historian/generate', function (string $id, \Illuminate\Http\Request $request, UniverseHistoryGenerator $historian) {
        $universe = Universe::findOrFail((int) $id);
        $fromTick = $request->has('from_tick') ? (int) $request->input('from_tick') : null;
        $toTick = $request->has('to_tick') ? (int) $request->input('to_tick') : null;
        $history = $historian->generate($universe, $fromTick, $toTick);
        if (! $history) return response()->json(['message' => 'Lỗi khi tạo lịch sử.'], 422);
        return response()->json(['data' => ['id' => $history->id, 'content' => $history->full_text, 'from_tick' => $history->from_tick, 'to_tick' => $history->to_tick]]);
    })->name('worldos.universes.historian.generate');

    Route::get('universes/{id}/causal-links', function (string $id, ChronicleSynthesisEngine $synthesisEngine) {
        $links = $synthesisEngine->synthesize((int) $id, (int) request('from_tick', 0), (int) request('to_tick', 1000000));
        return response()->json(['universe_id' => (int) $id, 'links' => $links]);
    })->name('worldos.universes.causal-links');

    // 3. Edicts & Scenarios
    Route::post('universes/{id}/decree', function (string $id, \Illuminate\Http\Request $request, DecreeUniverseAction $action) {
        $universe = Universe::findOrFail((int) $id);
        $result = $action->execute($universe, $request->input('edict_id'));
        return $result['ok'] ? response()->json(['message' => 'Đã ban hành sắc lệnh thành công']) : response()->json($result, 400);
    })->name('worldos.universes.decree');

    Route::post('universes/{id}/scenario', function (string $id, \Illuminate\Http\Request $request, LaunchScenarioAction $action) {
        $universe = Universe::findOrFail((int) $id);
        $result = $action->execute($universe, $request->input('scenario_id'));
        return $result['ok'] ? response()->json($result) : response()->json($result, 400);
    })->name('worldos.universes.scenario.launch');

    // 4. Intelligence & Actors
    Route::get('universes/{id}/actors', function (string $id, GetUniverseActorsAction $action) {
        return response()->json($action->execute((int)$id));
    })->name('worldos.universes.actors');

    Route::get('actors/{id}', function (string $id) {
        $actor = Actor::with('supremeEntity')->find((int)$id);
        if (!$actor) {
            return response()->json(['message' => 'Actor not found'], 404);
        }
        return response()->json($actor);
    })->name('worldos.actors.show');

    Route::get('actors/{id}/events', function (string $id) {
        $events = ActorEvent::where('actor_id', (int) $id)->orderBy('tick')->get();
        return response()->json($events);
    })->name('worldos.actors.events');

    Route::get('actors/{id}/decisions', function (string $id) {
        $decisions = AgentDecision::where('actor_id', (int) $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();
        return response()->json($decisions);
    })->name('worldos.actors.decisions');

    Route::get('universes/{id}/supreme-entities', function (string $id) {
        return response()->json(SupremeEntity::where('universe_id', (int) $id)->orderBy('entity_type')->orderByDesc('power_level')->get());
    })->name('worldos.universes.supreme-entities');

    Route::get('universes/{id}/great-persons', function (string $id) {
        return response()->json(SupremeEntity::where('universe_id', (int) $id)->where('entity_type', 'like', 'great_person_%')->orderBy('entity_type')->orderByDesc('power_level')->get());
    })->name('worldos.universes.great-persons');

    // 5. Simulation Logic & Control
    Route::post('simulation/advance', [UniverseController::class, 'advance'])->name('worldos.simulation.advance');
    Route::post('worlds/{id}/pulse', [UniverseController::class, 'pulse'])->name('worldos.worlds.pulse');
    Route::post('universes/{id}/apex/command', [ApexController::class, 'command'])->name('worldos.universes.apex');

    Route::post('universes/{id}/decide', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        return response()->json($action->execute($snapshot));
    })->name('worldos.universes.decide');

    Route::get('universes/{id}/decision-metrics', function (string $id, UniverseSnapshotRepository $repo, DecideUniverseAction $action) {
        $snapshot = $repo->getLatest((int)$id);
        if (!$snapshot) return response()->json(['action' => 'observe', 'navigator_score' => 0]);
        $result = $action->execute($snapshot);
        return response()->json([
            'action' => $result['action'],
            'navigator_score' => $result['navigator_score'],
            'meta' => $result['meta'] ?? []
        ]);
    })->name('worldos.universes.decision-metrics');

    // 6. Metrics & Biology
    Route::get('universes/{id}/biology-metrics', function (string $id, BiologyMetricsService $service, EcosystemMetricsService $ecosystemService, UniverseRepositoryInterface $universeRepo) {
        $universeId = (int) $id;
        $data = $service->forUniverse($universeId);
        $universe = $universeRepo->find($universeId);
        if ($universe) {
            $eco = $ecosystemService->forUniverse($universe);
            $data['instability_score'] = $eco['instability_score'];
            $sv = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : ($universe->state_vector ?: []);
            $collapse = $sv['ecological_collapse'] ?? [];
            $data['ecological_collapse_active'] = !empty($collapse['active']);
            $data['current_tick'] = $universe->current_tick ?? 0;
        }
        return response()->json($data);
    })->name('worldos.universes.biology-metrics');

    // 7. Social & Institutions
    Route::get('universes/{id}/social-contracts', function (string $id) {
        return response()->json(\App\Models\SocialContract::where('universe_id', (int) $id)->get());
    })->name('worldos.universes.social-contracts');

    Route::get('universes/{id}/institutional-entities', function (string $id) {
        return response()->json(\App\Models\InstitutionalEntity::where('universe_id', (int) $id)->get());
    })->name('worldos.universes.institutional-entities');

    Route::get('universes/{id}/institutions', [UniverseInstitutionController::class, 'index'])->name('worldos.universes.institutions');

    // 8. Library & Labs
    Route::get('library/rulesets', [RuleSetLibraryController::class, 'index']);
    Route::get('library/vocations', [VocationLibraryController::class, 'index']);
    Route::get('engines', [WorldosEnginesController::class, 'index'])->name('worldos.engines');
    Route::get('metrics', [WorldosEnginesController::class, 'metrics'])->name('worldos.metrics');
    Route::get('legends', function () {
        return response()->json(LegendaryAgent::with('universe:id,name')->orderByDesc('tick_discovered')->get());
    })->name('worldos.legends.index');

    Route::get('observer/dashboard', [ObserverDashboardController::class, 'getStatus'])->name('worldos.observer.dashboard');

    Route::group(['prefix' => 'lab/dashboard'], function () {
        Route::get('state', [DashboardController::class, 'state'])->name('worldos.lab.dashboard.state');
        Route::get('attractors', [DashboardController::class, 'attractors'])->name('worldos.lab.dashboard.attractors');
        Route::get('evolution', [DashboardController::class, 'evolution'])->name('worldos.lab.dashboard.evolution');
        Route::get('risks', [DashboardController::class, 'risks'])->name('worldos.lab.dashboard.risks');
        Route::get('intelligence', [DashboardController::class, 'intelligence'])->name('worldos.lab.dashboard.intelligence');
        Route::post('intervene', [DashboardController::class, 'intervene'])->name('worldos.lab.dashboard.intervene');
    });

    Route::get('analysis/patterns', function (AnalyticalAiService $ai) {
        return response()->json($ai->analyze(Universe::pluck('id')->all(), (int) request()->query('limit', 50)));
    })->name('worldos.analysis.patterns');

    Route::get('universes/{id}/search/mutations', function (string $id, SearchAiService $search) {
        return response()->json($search->suggestMutations([]));
    })->name('worldos.universes.search.mutations');
});
