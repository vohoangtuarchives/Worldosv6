<?php

use Illuminate\Support\Facades\Route;
use App\Modules\WorldOS\Http\Controllers\UniverseController;
use App\Modules\Simulation\Http\Controllers\RuleSetLibraryController;
use App\Modules\Simulation\Http\Controllers\VocationLibraryController;
use App\Modules\Simulation\Http\Controllers\WorldosEnginesController;
use App\Modules\Simulation\Http\Controllers\IpFactoryController;
use App\Modules\Simulation\Http\Controllers\MultiverseMapController;
use App\Modules\Simulation\Http\Controllers\UniverseGraphController;
use App\Modules\Intelligence\Http\Controllers\ObserverDashboardController;

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    // Standardized Universe Routes
    Route::get('universes', [UniverseController::class, 'index'])->name('worldos.universes.index');
    Route::get('universes/{id}', [UniverseController::class, 'show'])->name('worldos.universes.show');
    Route::get('universes/{id}/snapshot', [UniverseController::class, 'snapshot'])->name('worldos.universes.snapshot');
    Route::get('universes/{id}/snapshots', [UniverseController::class, 'snapshots'])->name('worldos.universes.snapshots');
    Route::post('universes/{id}/fork', [UniverseController::class, 'fork'])->name('worldos.universes.fork');
    
    // Narrative Routes
    Route::get('universes/{id}/chronicles', [\App\Modules\WorldOS\Http\Controllers\NarrativeController::class, 'chronicles'])->name('worldos.universes.chronicles');
    Route::get('universes/{id}/myth-scars', [\App\Modules\WorldOS\Http\Controllers\NarrativeController::class, 'mythScars'])->name('worldos.universes.myth-scars');
    Route::get('universes/{id}/artifacts', [\App\Modules\WorldOS\Http\Controllers\NarrativeController::class, 'artifacts'])->name('worldos.universes.artifacts');
    
    // Simulation Logic
    Route::post('simulation/advance', [UniverseController::class, 'advance'])->name('worldos.simulation.advance');
    Route::post('worlds/{id}/pulse', [UniverseController::class, 'pulse'])->name('worldos.worlds.pulse');

    // Library & Meta
    Route::get('library/rulesets', [RuleSetLibraryController::class, 'index']);
    Route::get('library/vocations', [VocationLibraryController::class, 'index']);
    Route::get('engines', [WorldosEnginesController::class, 'index'])->name('worldos.engines');
    Route::get('metrics', [WorldosEnginesController::class, 'metrics'])->name('worldos.metrics');
});
