<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Universe;
use App\Models\World;
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

    /**
     * Bloom public endpoint: hierarchical WorldOS → World → Universe structure.
     * Used by the Bloom UI (port 3001) for DAG visualization.
     */
    public function bloom(): JsonResponse
    {
        $worlds = World::with(['universes' => function ($q) {
            $q->select('id', 'world_id', 'name', 'status', 'structural_coherence', 'parent_universe_id', 'current_tick')
              ->orderBy('id');
        }])->select('id', 'name', 'origin', 'current_genre')->get();

        $worldsData = $worlds->map(function (World $w) {
            $universes = $w->universes->map(function (Universe $u) {
                return [
                    'id'               => (string) $u->id,
                    'label'            => $u->name,
                    'sub'              => 'Tick #' . $u->current_tick,
                    'status'           => $u->status ?? 'active',
                    'sci'              => (int) round($u->structural_coherence ?? 0),
                    'parentUniverseId' => $u->parent_universe_id ? (string) $u->parent_universe_id : null,
                ];
            });

            $avgSci = $universes->avg('sci') ?? 0;

            return [
                'id'        => (string) $w->id,
                'label'     => $w->name,
                'sub'       => $w->current_genre ?? $w->origin ?? 'Unknown genre',
                'sci'       => (int) round($avgSci),
                'universes' => $universes->values(),
            ];
        });

        return response()->json([
            'id'     => 'worldos',
            'label'  => 'The Multiverse',
            'sub'    => 'WorldOS — Simulation Active',
            'worlds' => $worldsData->values(),
        ]);
    }
}
