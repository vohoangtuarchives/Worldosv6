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
use App\Models\Universe;
use App\Models\World;
use App\Models\BranchEvent;
use App\Models\MaterialInstance;
use App\Models\Material;
use App\Models\UniverseInteraction;
use App\Models\CausalTrajectory;
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use App\Modules\Simulation\Services\ImplicitOrchestratorService;
use App\Modules\Simulation\Services\ScenarioEngine;
use App\Modules\Institutions\Services\WorldEdictEngine;
use App\Contracts\UniverseEvaluatorInterface;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use Illuminate\Support\Facades\Route;

// Redundant worldos prefix routes removed. Handled by WorldOS module.

Route::middleware('auth:sanctum')->prefix('ip-factory')->group(function () {
    Route::get('presets', [IpFactoryController::class, 'presets']);
    Route::post('merge', [IpFactoryController::class, 'merge']);
    Route::get('registry', [IpFactoryController::class, 'registry']);
});


