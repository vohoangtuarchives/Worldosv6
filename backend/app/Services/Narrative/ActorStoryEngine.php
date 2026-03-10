<?php

namespace App\Services\Narrative;

use App\Models\Actor;
use App\Models\ActorEvent;
use App\Models\Artifact;
use App\Models\InstitutionalEntity;

/**
 * Actor Story Engine (Narrative v2).
 *
 * Builds actor-centric life history from ActorEvent + artifacts/institutions.
 * Used by HistoryEngine and AI Historian for "The Rise of X" narratives.
 */
class ActorStoryEngine
{
    /**
     * Build full life history for an actor (events, artifacts, institutions).
     */
    public function buildLifeHistory(Actor $actor): ActorHistoryDTO
    {
        $majorEvents = $this->getMajorEvents($actor, 50);

        $artifactIds = Artifact::where('creator_actor_id', $actor->id)->pluck('id')->all();
        $institutionIds = InstitutionalEntity::where('founder_actor_id', $actor->id)->pluck('id')->all();

        return new ActorHistoryDTO(
            actorId: $actor->id,
            birthTick: $actor->birth_tick,
            deathTick: $actor->death_tick,
            majorEvents: $majorEvents,
            artifactIds: $artifactIds,
            institutionIds: $institutionIds,
        );
    }

    /**
     * Get major events for an actor (from ActorEvent), for narrative/legend.
     *
     * @return array<int, array{tick: int, event_type: string, context?: array}>
     */
    public function getMajorEvents(Actor $actor, int $limit = 20): array
    {
        return ActorEvent::where('actor_id', $actor->id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get()
            ->map(fn (ActorEvent $e) => [
                'tick' => $e->tick,
                'event_type' => $e->event_type,
                'context' => $e->context,
            ])
            ->values()
            ->all();
    }
}
