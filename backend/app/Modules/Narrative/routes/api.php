<?php

use App\Modules\Narrative\Models\Chronicle;
use App\Modules\Narrative\Models\NarrativeSeries;
use App\Modules\Narrative\Models\StoryBible;
use App\Modules\Narrative\Services\UniverseHistoryGenerator;
use App\Modules\Narrative\Services\NarrativeAiService;
use App\Modules\Narrative\Services\ChronicleSynthesisEngine;
use App\Modules\Narrative\Actions\DecreeUniverseAction;
use App\Modules\Narrative\Actions\LaunchScenarioAction;
use App\Modules\Narrative\Http\Controllers\LoomStatusController;
use App\Modules\Narrative\Http\Controllers\ZenithController;
use App\Modules\Narrative\Http\Controllers\MythScarController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    Route::get('universes/{id}/chronicles', function (string $id) {
        $limit = request()->input('limit', 10);
        $chronicles = Chronicle::where('universe_id', (int) $id)
            ->orderByDesc('to_tick')
            ->paginate((int)$limit);
        return response()->json($chronicles);
    })->name('worldos.universes.chronicles');

    Route::post('universes/{id}/generate-chronicle', function (string $id, \Illuminate\Http\Request $request, NarrativeAiService $narrativeAi) {
        $universeId = (int) $id;
        $universe = \App\Modules\Simulation\Models\Universe::findOrFail($universeId);
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
        $universe = \App\Modules\Simulation\Models\Universe::findOrFail((int) $id);
        $fromTick = $request->has('from_tick') ? (int) $request->input('from_tick') : null;
        $toTick = $request->has('to_tick') ? (int) $request->input('to_tick') : null;
        $history = $historian->generate($universe, $fromTick, $toTick);
        if (! $history) return response()->json(['message' => 'Lỗi khi tạo lịch sử.'], 422);
        return response()->json(['data' => ['id' => $history->id, 'content' => $history->full_text, 'from_tick' => $history->from_tick, 'to_tick' => $history->to_tick]]);
    })->name('worldos.universes.historian.generate');

    Route::post('universes/{id}/decree', function (string $id, \Illuminate\Http\Request $request, DecreeUniverseAction $action) {
        $universe = \App\Modules\Simulation\Models\Universe::findOrFail((int) $id);
        $result = $action->execute($universe, $request->input('edict_id'));
        return $result['ok'] ? response()->json(['message' => 'Đã ban hành sắc lệnh thành công']) : response()->json($result, 400);
    })->name('worldos.universes.decree');

    Route::post('universes/{id}/scenario', function (string $id, \Illuminate\Http\Request $request, LaunchScenarioAction $action) {
        $universe = \App\Modules\Simulation\Models\Universe::findOrFail((int) $id);
        $result = $action->execute($universe, $request->input('scenario_id'));
        return $result['ok'] ? response()->json($result) : response()->json($result, 400);
    })->name('worldos.universes.scenario.launch');

    Route::get('universes/{id}/causal-links', function (string $id, ChronicleSynthesisEngine $synthesisEngine) {
        $links = $synthesisEngine->synthesize((int) $id, (int) request('from_tick', 0), (int) request('to_tick', 1000000));
        return response()->json(['universe_id' => (int) $id, 'links' => $links]);
    })->name('worldos.universes.causal-links');

    Route::get('universes/{id}/myth-scars', [MythScarController::class, 'index'])->name('worldos.universes.myth-scars');
    Route::get('universes/{id}/zenith', [ZenithController::class, 'show'])->name('worldos.universes.zenith');
});

Route::get('/loom-status', [LoomStatusController::class, 'status']);
