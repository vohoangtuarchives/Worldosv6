<?php

use Illuminate\Support\Facades\Route;
use App\Modules\WorldOS\Http\Controllers\UniverseController;
use App\Modules\WorldOS\Http\Controllers\NarrativeController;
use App\Modules\WorldOS\Http\Controllers\Api\ActorController;
use App\Modules\WorldOS\Http\Controllers\Api\WorldController;
use App\Modules\WorldOS\Http\Controllers\Api\TimelineController;
use App\Modules\WorldOS\Http\Controllers\Api\AiConfigController;

Route::prefix('worldos')->group(function () {
    // 1. Core Universe Management
    Route::get('universes', [UniverseController::class , 'index'])->name('worldos.universes.index');
    Route::post('universes', [UniverseController::class , 'store'])->name('worldos.universes.store');
    Route::get('universes/{id}', [UniverseController::class , 'show'])->name('worldos.universes.show');
    Route::patch('universes/{id}', [UniverseController::class , 'update'])->name('worldos.universes.update');
    Route::delete('universes/{id}', [UniverseController::class , 'destroy'])->name('worldos.universes.destroy');
    Route::post('universes/{id}/toggle-status', [UniverseController::class , 'toggleStatus'])->name('worldos.universes.toggle-status');
    Route::get('universes/{id}/metrics', [UniverseController::class , 'metrics'])->name('worldos.universes.metrics');
    Route::get('universes/{id}/dossier', [UniverseController::class , 'dossier'])->name('worldos.universes.dossier');
    Route::get('universes/{id}/reality-state', [UniverseController::class , 'realityState'])->name('worldos.universes.reality-state');
    Route::get('universes/{id}/snapshot', [UniverseController::class , 'snapshot'])->name('worldos.universes.snapshot');
    Route::post('universes/{id}/snapshots', [UniverseController::class , 'createSnapshot'])->name('worldos.universes.snapshots.create');
    Route::get('universes/{id}/snapshots', [UniverseController::class , 'snapshots'])->name('worldos.universes.snapshots');
    Route::get('universes/{id}/forks', [UniverseController::class , 'forks'])->name('worldos.universes.forks');
    Route::get('universes/{id}/forks/compare', [UniverseController::class , 'compareFork'])->name('worldos.universes.forks.compare');
    Route::get('snapshots/{snapshotId}', [UniverseController::class , 'getSnapshot'])->name('worldos.snapshots.show');

    // 2. World Management (Basic Only)
    Route::get('worlds', [WorldController::class , 'index'])->name('worldos.worlds.index');
    Route::get('worlds/{id}/simulation-status', [UniverseController::class , 'status'])->name('worldos.worlds.status');

    // 3. Narrative & Chronicles (Results)
    Route::get('universes/{id}/chronicles', [NarrativeController::class , 'chronicles'])->name('worldos.universes.chronicles');
    Route::get('universes/{id}/myth-scars', [NarrativeController::class , 'mythScars'])->name('worldos.universes.myth-scars');
    Route::get('universes/{id}/artifacts', [NarrativeController::class , 'artifacts'])->name('worldos.universes.artifacts');
    Route::get('universes/{id}/history-timeline', [TimelineController::class , 'history'])->name('worldos.universes.history-timeline');

    Route::post('universes/{id}/generate-chronicle', [TimelineController::class , 'generateChronicle'])->name('worldos.universes.generate-chronicle');
    Route::post('universes/{id}/historian/generate', [TimelineController::class , 'generateHistory'])->name('worldos.universes.historian.generate');
    Route::get('universes/{id}/causal-links', [TimelineController::class , 'causalLinks'])->name('worldos.universes.causal-links');

    // 4. Actors & Supreme Entities (Simulation Entities)
    Route::get('universes/{id}/actors', [ActorController::class , 'index'])->name('worldos.universes.actors');
    Route::get('actors/{id}', [ActorController::class , 'show'])->name('worldos.actors.show');
    Route::get('actors/{id}/events', [ActorController::class , 'events'])->name('worldos.actors.events');
    Route::get('actors/{id}/decisions', [ActorController::class , 'decisions'])->name('worldos.actors.decisions');
    Route::post('actors/{id}/mind-meld', [ActorController::class , 'mindMeld'])->name('worldos.actors.mind-meld');
    
    Route::get('universes/{id}/supreme-entities', [ActorController::class , 'supremeEntities'])->name('worldos.universes.supreme-entities');

    // 5. Simulation Logic & Control (Calculation Engine)
    Route::post('simulation/advance', [UniverseController::class , 'advance'])->name('worldos.simulation.advance');
    Route::post('worlds/{id}/pulse', [UniverseController::class , 'pulse'])->name('worldos.worlds.pulse');
    Route::post('universes/{id}/fork', [UniverseController::class , 'fork'])->name('worldos.universes.fork');
    Route::get('analytics/ticks', [\App\Modules\WorldOS\Http\Controllers\Api\AnalyticsController::class , 'getTickAnalytics'])->name('worldos.analytics.ticks');

    // 6. System Configuration & AI Management (Observability)
    Route::get('config/keys', [AiConfigController::class , 'listKeys'])->name('worldos.config.keys.list');
    Route::post('config/keys', [AiConfigController::class , 'storeKey'])->name('worldos.config.keys.store');
    Route::delete('config/keys/{id}', [AiConfigController::class , 'destroyKey'])->name('worldos.config.keys.destroy');
    Route::get('config/settings', [AiConfigController::class , 'getSettings'])->name('worldos.config.settings.get');
    Route::post('config/settings', [AiConfigController::class , 'updateSetting'])->name('worldos.config.settings.update');
});
