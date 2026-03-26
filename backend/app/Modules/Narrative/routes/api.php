<?php

use App\Modules\Narrative\Http\Controllers\LoomStatusController;
use App\Modules\Narrative\Http\Controllers\NarrativeController;
use Illuminate\Support\Facades\Route;

// Narrative Module Specific Only
Route::get('/loom-status', [LoomStatusController::class, 'status']);
Route::get('/universes/{universe}/omen-context', [NarrativeController::class, 'omenContext']);
