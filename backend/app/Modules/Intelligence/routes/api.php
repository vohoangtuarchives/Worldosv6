<?php

use Illuminate\Support\Facades\Route;

use App\Modules\Intelligence\Http\Controllers\AiLogController;
use App\Modules\Intelligence\Http\Controllers\AiSettingsController;
use App\Modules\Intelligence\Http\Controllers\AiDiagnosticsController;
use App\Modules\Intelligence\Http\Controllers\AiKeyPoolController;

// AI Configuration (Database & Cache)

Route::group(['prefix' => 'ai-settings'], function () {
    Route::get('/', [AiSettingsController::class, 'index']);
    Route::post('/update', [AiSettingsController::class, 'update']);
    Route::post('/sync', [AiSettingsController::class, 'sync']);
    Route::post('/import', [AiSettingsController::class, 'import']);
    Route::get('/drivers', [AiSettingsController::class, 'drivers']);
    Route::post('/diagnostics', [AiDiagnosticsController::class, 'run']);
});

// AI Keys Pool
Route::apiResource('ai-key-pool', AiKeyPoolController::class);

// AI Logs & Monitoring
Route::get('/ai-logs/stats', [AiLogController::class, 'stats']);
Route::get('/ai-logs', [AiLogController::class, 'index']);
Route::get('/ai-logs/{id}', [AiLogController::class, 'show']);
Route::delete('/ai-logs/clear', [AiLogController::class, 'clear']);
