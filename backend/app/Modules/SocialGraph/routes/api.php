<?php

use App\Modules\SocialGraph\Models\SocialContract;
use App\Modules\SocialGraph\Models\InstitutionalEntity;
use App\Modules\SocialGraph\Http\Controllers\UniverseInstitutionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('worldos')->group(function () {
    Route::get('universes/{id}/social-contracts', function (string $id) {
        return response()->json(SocialContract::where('universe_id', (int) $id)->orderByDesc('created_at')->get());
    })->name('worldos.universes.social-contracts');

    Route::get('universes/{id}/institutional-entities', function (string $id) {
        return response()->json(InstitutionalEntity::where('universe_id', (int) $id)->whereNull('collapsed_at_tick')->orderByDesc('org_capacity')->get());
    })->name('worldos.universes.institutional-entities');

    Route::get('universes/{id}/institutions', [UniverseInstitutionController::class, 'index'])->name('worldos.universes.institutions');
});
