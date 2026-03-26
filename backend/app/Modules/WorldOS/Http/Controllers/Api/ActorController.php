<?php

namespace App\Modules\WorldOS\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actor;
use App\Models\ActorEvent;
use App\Models\AgentDecision;
use App\Models\SupremeEntity;
use App\Modules\Intelligence\Actions\GetUniverseActorsAction;
use App\Modules\WorldOS\Http\Resources\ActorDecisionResource;
use App\Modules\WorldOS\Http\Resources\ActorDetailResource;
use App\Modules\WorldOS\Http\Resources\ActorEventResource;
use App\Modules\WorldOS\Http\Resources\ActorSummaryResource;
use App\Modules\WorldOS\Http\Resources\SupremeEntityResource;
use Illuminate\Http\JsonResponse;

class ActorController extends Controller
{
    public function index(int $id, GetUniverseActorsAction $action): JsonResponse
    {
        $actors = $action->execute($id);

        return ActorSummaryResource::collection($actors)->response();
    }

    public function show(int $id): JsonResponse
    {
        $actor = Actor::with(['supremeEntity', 'events'])->find($id);
        if (! $actor) {
            return response()->json(['message' => 'Actor not found'], 404);
        }

        return (new ActorDetailResource($actor))->response();
    }

    public function events(int $id): JsonResponse
    {
        $events = ActorEvent::where('actor_id', $id)->orderBy('tick')->get();

        return ActorEventResource::collection($events)->response();
    }

    public function decisions(int $id): JsonResponse
    {
        $decisions = AgentDecision::where('actor_id', $id)
            ->orderByDesc('tick')
            ->limit(50)
            ->get();

        return ActorDecisionResource::collection($decisions)->response();
    }

    public function supremeEntities(int $id): JsonResponse
    {
        $entities = SupremeEntity::where('universe_id', $id)
            ->orderBy('entity_type')
            ->orderByDesc('power_level')
            ->get();

        return SupremeEntityResource::collection($entities)->response();
    }
}
