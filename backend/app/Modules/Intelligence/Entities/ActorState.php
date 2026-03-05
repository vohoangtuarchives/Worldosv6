<?php

namespace App\Modules\Intelligence\Entities;

/**
 * Immutable Data Transfer Object for Actor's state.
 * Contains only properties, no business logic or side effects.
 */
class ActorState
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $universeId,
        public readonly string $name,
        public readonly string $archetype,
        public readonly array $traits = [],
        public readonly array $metrics = [],
        public readonly bool $isAlive = true,
        public readonly int $generation = 1,
        public readonly ?string $biography = null
    ) {}

    /**
     * Create a new instance with modified properties (Immutable style)
     */
    public function with(array $changes): self
    {
        return new self(
            id: array_key_exists('id', $changes) ? $changes['id'] : $this->id,
            universeId: array_key_exists('universeId', $changes) ? $changes['universeId'] : $this->universeId,
            name: array_key_exists('name', $changes) ? $changes['name'] : $this->name,
            archetype: array_key_exists('archetype', $changes) ? $changes['archetype'] : $this->archetype,
            traits: array_key_exists('traits', $changes) ? $changes['traits'] : $this->traits,
            metrics: array_key_exists('metrics', $changes) ? $changes['metrics'] : $this->metrics,
            isAlive: array_key_exists('isAlive', $changes) ? $changes['isAlive'] : $this->isAlive,
            generation: array_key_exists('generation', $changes) ? $changes['generation'] : $this->generation,
            biography: array_key_exists('biography', $changes) ? $changes['biography'] : $this->biography
        );
    }
}
