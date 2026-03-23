<?php

use App\Modules\Intelligence\Http\Controllers\AuthController;
use App\Modules\Intelligence\Http\Controllers\AgentConfigController;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

// Module Specific Config (non-WorldOS generic)
Route::middleware('auth:sanctum')->prefix('intelligence')->group(function () {
    Route::get('/agent-config', [AgentConfigController::class, 'show']);
    Route::post('/agent-config', [AgentConfigController::class, 'store']);
});
