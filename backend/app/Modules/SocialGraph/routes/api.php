<?php

use Illuminate\Support\Facades\Route;

// All SocialGraph universe routes moved to WorldOS
Route::middleware('auth:sanctum')->prefix('social-graph')->group(function () {
    // Future module-specific routes here
});
