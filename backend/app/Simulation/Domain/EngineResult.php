<?php

namespace App\Simulation\Domain;

use App\Simulation\Contracts\Effect;

/**
 * Result of an engine tick: events to publish, state changes (effects), and metrics.
 * Engine must not mutate state directly; Kernel applies stateChanges via EffectResolver.
 */
final class EngineResult
{
    /** @var object[] WorldEvent-like DTOs or arrays for Event Bus */
    public array $events = [];

    /** @var Effect[] Effects to apply to WorldState */
    public array $stateChanges = [];

    /** @var array<string, mixed> Metrics for analytics / AEE */
    public array $metrics = [];

    public function __construct(
        array $events = [],
        array $stateChanges = [],
        array $metrics = [],
    ) {
        $this->events = $events;
        $this->stateChanges = $stateChanges;
        $this->metrics = $metrics;
    }

    public static function empty(): self
    {
        return new self([], [], []);
    }

    public static function fromEffects(array $effects, array $events = [], array $metrics = []): self
    {
        return new self($events, $effects, $metrics);
    }
}
