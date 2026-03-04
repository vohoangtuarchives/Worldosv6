<?php

namespace App\Http\Controllers\Api\Loom;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\World;
use Illuminate\Http\JsonResponse;

class LoomWorldStateController extends Controller
{
    /**
     * Tương đương: GET /api/loom/v1/narrative/state-snapshot/{world_id}
     * Cung cấp bức tranh vĩ mô của toàn bộ Thế Giới (các vũ trụ bên trong).
     */
    public function show(Request $request, string $worldId): JsonResponse
    {
        $world = World::with(['universes'])->find($worldId);

        if (!$world) {
            return response()->json(['error' => 'World not found'], 404);
        }

        $universesData = [];
        foreach ($world->universes as $universe) {
            $universesData[] = [
                'universe_id' => $universe->id,
                'name' => "Universe {$universe->id}",
                'topology' => $universe->topology,
                'entropy' => $universe->entropy,
                'structural_coherence' => $universe->structural_coherence,
                'is_chaotic' => (bool)$universe->is_chaotic,
                'observer_effect_intensity' => $universe->observer_effect_intensity,
                'active_demiurges' => \App\Models\Demiurge::where('universe_id', $universe->id)->count(),
                'state_vector_summary' => [
                    'zones_count' => count($universe->state_vector['zones'] ?? []),
                    'axioms' => count($universe->state_vector['axioms'] ?? []),
                    'scars' => count($universe->state_vector['scars'] ?? [])
                ]
            ];
        }

        $snapshot = [
            'world_id' => $world->id,
            'global_tick' => $world->global_tick,
            'is_chaotic_timeline' => (bool)$world->is_chaotic,
            'universes' => $universesData
        ];

        return response()->json($snapshot);
    }
}
