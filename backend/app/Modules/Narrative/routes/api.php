<?php

use App\Modules\Narrative\Http\Controllers\LoomStatusController;
use App\Modules\Narrative\Http\Controllers\NarrativeController;
use App\Modules\Narrative\Http\Controllers\LoomChronicleController;
use App\Modules\Narrative\Http\Controllers\LoomCharacterController;
use App\Modules\Narrative\Http\Controllers\LoomWorldStateController;
use Illuminate\Support\Facades\Route;

// Narrative Module Specific Only
Route::get('/loom-status', [LoomStatusController::class, 'status']);
Route::get('/universes/{universe}/omen-context', [NarrativeController::class, 'omenContext']);

// Loom Integration Routes (internal - narrative-loom calls these)
Route::get('/loom/v1/narrative/chronicles', [LoomChronicleController::class, 'index']);
Route::get('/loom/v1/narrative/characters/{character_id}', [LoomCharacterController::class, 'show']);
Route::get('/loom/v1/narrative/state-snapshot/{world_id}', [LoomWorldStateController::class, 'show']);
