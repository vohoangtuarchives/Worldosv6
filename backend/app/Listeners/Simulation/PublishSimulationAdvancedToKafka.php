<?php

namespace App\Listeners\Simulation;

use App\Contracts\SimulationEventStreamProducerInterface;
use App\Events\Simulation\UniverseSimulationPulsed;

/**
 * Publish SimulationAdvanced to Kafka (Phase 1 event stream) when advance completes.
 */
class PublishSimulationAdvancedToKafka
{
    public function __construct(
        protected SimulationEventStreamProducerInterface $producer
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;
        $tick = (int) $snapshot->tick;

        $payload = [
            'snapshot_tick' => $tick,
            'entropy' => $snapshot->entropy ?? $universe->entropy ?? null,
            'stability_index' => $snapshot->stability_index ?? null,
        ];
        $engineResponse = $event->engineResponse ?? [];
        if (isset($engineResponse['snapshot']['sci'])) {
            $payload['sci'] = $engineResponse['snapshot']['sci'];
        }
        if (isset($engineResponse['snapshot']['instability_gradient'])) {
            $payload['instability_gradient'] = $engineResponse['snapshot']['instability_gradient'];
        }

        $this->producer->publishSimulationAdvanced((int) $universe->id, $tick, $payload);
    }
}
