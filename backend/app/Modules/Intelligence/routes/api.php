<?php

use App\Modules\Intelligence\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Auth Routes (Infrastructure Core)
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/user', [AuthController::class, 'me']);

// agent-config routes removed as they are not core calculation logic
