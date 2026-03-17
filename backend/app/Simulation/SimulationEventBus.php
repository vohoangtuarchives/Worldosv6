<?php

namespace App\Simulation;

use App\Events\Simulation\SimulationEventOccurred;
use Illuminate\Support\Facades\Event;

use App\Simulation\Events\Contracts\SimulationEventInterface;

/**
 * Event Bus for simulation events (Tier 3).
 * Central place to emit typed events (e.g. ActorDiedEvent).
 * Dispatches both the typed event and the generic SimulationEventOccurred for legacy listeners.
 */
final class SimulationEventBus
{
    public function dispatch(SimulationEventInterface $event): void
    {
        // 1. Phân phối Typed Event mới
        Event::dispatch($event);
        
        // 2. Phân phối Event chung cho các listener cũ (Kafka, DB, Neo4j)
        Event::dispatch(new SimulationEventOccurred(
            $event->getUniverseId(),
            $event->getType(),
            $event->getTick(),
            $event->getPayload()
        ));
    }
}
