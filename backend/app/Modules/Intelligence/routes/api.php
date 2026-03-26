<?php

use Illuminate\Support\Facades\Route;

// AI Configuration (Database & Cache)

Route::group(['prefix' => 'ai-settings'], function () {
    Route::get('/', [\App\Modules\Intelligence\Http\Controllers\AiSettingsController::class, 'index']);
    Route::post('/update', [\App\Modules\Intelligence\Http\Controllers\AiSettingsController::class, 'update']);
    Route::post('/sync', [\App\Modules\Intelligence\Http\Controllers\AiSettingsController::class, 'sync']);
    Route::post('/import', [\App\Modules\Intelligence\Http\Controllers\AiSettingsController::class, 'import']);
    Route::get('/drivers', [\App\Modules\Intelligence\Http\Controllers\AiSettingsController::class, 'drivers']);
    Route::post('/diagnostics', [\App\Modules\Intelligence\Http\Controllers\AiDiagnosticsController::class, 'run']);
});

// AI Logs
Route::get('/ai-logs', [\App\Modules\Intelligence\Http\Controllers\AiLogController::class, 'index']);
Route::get('/ai-logs/{id}', [\App\Modules\Intelligence\Http\Controllers\AiLogController::class, 'show']);
Route::delete('/ai-logs/clear', [\App\Modules\Intelligence\Http\Controllers\AiLogController::class, 'clear']);
