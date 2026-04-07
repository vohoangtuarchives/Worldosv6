<?php

use Illuminate\Support\Facades\Route;

use App\Modules\Intelligence\Http\Controllers\AiLogController;
use App\Modules\Intelligence\Http\Controllers\AiSettingsController;
use App\Modules\Intelligence\Http\Controllers\AiDiagnosticsController;
use App\Modules\Intelligence\Http\Controllers\AiKeyPoolController;

// AI Configuration & Logs (GET — public)
Route::middleware('api')->group(function () {
    Route::get('ai-settings', [AiSettingsController::class, 'index']);
    Route::get('ai-settings/drivers', [AiSettingsController::class, 'drivers']);

    Route::get('ai-key-pool', [AiKeyPoolController::class, 'index']);
    Route::get('ai-key-pool/{ai_key_pool}', [AiKeyPoolController::class, 'show']);

    Route::get('/ai-logs/stats', [AiLogController::class, 'stats']);
    Route::get('/ai-logs', [AiLogController::class, 'index']);
    Route::get('/ai-logs/{id}', [AiLogController::class, 'show']);
});

// AI Configuration & Logs (POST/PATCH/PUT/DELETE — protected)
Route::middleware(['api', 'auth:sanctum'])->group(function () {
    Route::post('ai-settings/update', [AiSettingsController::class, 'update']);
    Route::post('ai-settings/sync', [AiSettingsController::class, 'sync']);
    Route::post('ai-settings/import', [AiSettingsController::class, 'import']);
    Route::post('ai-settings/diagnostics', [AiDiagnosticsController::class, 'run']);

    Route::post('ai-key-pool', [AiKeyPoolController::class, 'store']);
    Route::put('ai-key-pool/{ai_key_pool}', [AiKeyPoolController::class, 'update']);
    Route::patch('ai-key-pool/{ai_key_pool}', [AiKeyPoolController::class, 'update']);
    Route::delete('ai-key-pool/{ai_key_pool}', [AiKeyPoolController::class, 'destroy']);

    Route::delete('/ai-logs/clear', [AiLogController::class, 'clear']);
});
