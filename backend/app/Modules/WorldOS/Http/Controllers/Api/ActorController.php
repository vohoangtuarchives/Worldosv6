<?php

namespace App\Modules\WorldOS\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actor;
use App\Models\ActorEvent;
use App\Models\AgentDecision;
use App\Models\SupremeEntity;
use App\Modules\Intelligence\Actions\GetUniverseActorsAction;
use Illuminate\Http\JsonResponse;

class ActorController extends Controller
{
    public function index(int $id, GetUniverseActorsAction $action): JsonResponse
    {
        return response()->json($action->execute($id));
    }

    public function show(int $id): JsonResponse
    {
        $actor = Actor::with('supremeEntity')->find($id);
        if (!$actor) {
            return response()->json(['message' => 'Actor not found'], 404);
        }
        return response()->json($actor);
    }

    public function events(int $id): JsonResponse
    {
        $events = ActorEvent::where('actor_id', $id)->orderBy('tick')->get();
        return response()->json($events);
    }

    public function decisions(int $id): JsonResponse
    {
        $decisions = AgentDecision::where('actor_id', $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();
        return response()->json($decisions);
    }

    public function supremeEntities(int $id): JsonResponse
    {
        return response()->json(
            SupremeEntity::where('universe_id', $id)
                ->orderBy('entity_type')
                ->orderByDesc('power_level')
                ->get()
        );
    }
}
