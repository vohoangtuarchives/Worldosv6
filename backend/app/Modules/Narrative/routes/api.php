<?php

use App\Modules\Narrative\Http\Controllers\LoomStatusController;
use Illuminate\Support\Facades\Route;

// Narrative Module Specific Only
Route::get('/loom-status', [LoomStatusController::class, 'status']);
