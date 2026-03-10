<?php

namespace App\Services\Narrative;

/**
 * DTO for an actor's life history (Narrative v2 — Actor Story Engine).
 */
final class ActorHistoryDTO
{
    public function __construct(
        public readonly int $actorId,
        public readonly ?int $birthTick,
        public readonly ?int $deathTick,
        public readonly array $majorEvents,
        public readonly array $artifactIds,
        public readonly array $institutionIds,
    ) {
    }

    public function toArray(): array
    {
        return [
            'actor_id' => $this->actorId,
            'birth_tick' => $this->birthTick,
            'death_tick' => $this->deathTick,
            'major_events' => $this->majorEvents,
            'artifact_ids' => $this->artifactIds,
            'institution_ids' => $this->institutionIds,
        ];
    }
}
