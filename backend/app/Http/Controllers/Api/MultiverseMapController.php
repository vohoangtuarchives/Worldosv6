<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Universe;
use Illuminate\Http\JsonResponse;

/**
 * MultiverseMapController: Serves the high-level DAG of all active and collapsed universes (§V12).
 * This is the data source for the Architect's 'Multiverse View'.
 */
class MultiverseMapController extends Controller
{
    public function index(): JsonResponse
    {
        $universes = Universe::all(['id', 'name', 'parent_universe_id', 'status', 'structural_coherence', 'entropy']);

        $nodes = $universes->map(function($u) {
            return [
                'id' => $u->id,
                'label' => $u->name,
                'status' => $u->status,
                'metrics' => [
                    'sci' => $u->structural_coherence,
                    'entropy' => $u->entropy,
                ],
                'type' => $u->parent_universe_id ? 'branch' : 'origin'
            ];
        });

        $edges = $universes->whereNotNull('parent_universe_id')->map(function($u) {
            return [
                'from' => $u->parent_universe_id,
                'to' => $u->id,
                'type' => 'birth'
            ];
        });

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges->values(),
        ]);
    }
}
