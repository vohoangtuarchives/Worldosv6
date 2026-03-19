<?php

use App\Modules\Simulation\Http\Controllers\RuleSetLibraryController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'api/simulation'], function () {
    Route::get('/ruleset-library', [RuleSetLibraryController::class, 'index']);
});
