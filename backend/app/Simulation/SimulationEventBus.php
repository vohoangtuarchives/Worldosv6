<?php

namespace App\Simulation;

use App\Events\Simulation\SimulationEventOccurred;
use Illuminate\Support\Facades\Event;

/**
 * Event Bus for simulation events (Tier 3).
 * Central place to emit ActorDied, SpeciesExtinct, CollapseTriggered, PhaseTransition, etc.
 * Dispatches SimulationEventOccurred so listeners can log to Chronicle, History, or metrics.
 */
final class SimulationEventBus
{
    public const TYPE_ACTOR_DIED = 'actor_died';
    public const TYPE_SPECIES_EXTINCT = 'species_extinct';
    public const TYPE_ECOLOGICAL_COLLAPSE = 'ecological_collapse';
    public const TYPE_ECOLOGICAL_COLLAPSE_RECOVERY = 'ecological_collapse_recovery';
    public const TYPE_ECOLOGICAL_PHASE_TRANSITION = 'ecological_phase_transition';
    public const TYPE_CIVILIZATION_COLLAPSE = 'civilization_collapse';

    public function dispatch(int $universeId, string $type, int $tick, array $payload = []): void
    {
        Event::dispatch(new SimulationEventOccurred($universeId, $type, $tick, $payload));
    }
}
