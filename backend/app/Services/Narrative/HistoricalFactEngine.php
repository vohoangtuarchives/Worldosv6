<?php

namespace App\Services\Narrative;

use App\Models\HistoricalFact;
use App\Models\UniverseSnapshot;
use App\Simulation\Events\WorldEvent;

/**
 * Historical Fact Engine (Narrative v2 Layer 2).
 *
 * Records structured historical facts from WorldEvent + UniverseSnapshot.
 * Narrative/Chronicle layers consume these facts instead of raw state.
 */
class HistoricalFactEngine
{
    /**
     * Record one or more historical fact rows from a WorldEvent and snapshot.
     */
    public function record(WorldEvent $event, UniverseSnapshot $snapshot): HistoricalFact
    {
        $tick = (int) $snapshot->tick;
        $payload = $event->payload;
        $metrics = (array) ($snapshot->metrics ?? []);
        if (isset($payload['metrics']) && is_array($payload['metrics'])) {
            $metrics = array_merge($metrics, $payload['metrics']);
        }

        $year = $this->tickToYear($tick);

        $facts = $payload['facts'] ?? [$event->type];
        if (! is_array($facts)) {
            $facts = [$event->type];
        }

        return HistoricalFact::create([
            'world_event_id' => $event->id,
            'universe_id' => $event->universeId,
            'tick' => $tick,
            'year' => $year,
            'zone_id' => $payload['zone_id'] ?? null,
            'civilization_id' => $payload['civilization_id'] ?? null,
            'category' => $event->type,
            'actors' => $event->actors,
            'institutions' => $payload['institutions'] ?? null,
            'metrics_before' => $payload['metrics_before'] ?? null,
            'metrics_after' => $metrics,
            'facts' => $facts,
        ]);
    }

    private function tickToYear(?int $tick): ?int
    {
        if ($tick === null) {
            return null;
        }
        $ticksPerYear = (int) config('worldos.intelligence.ticks_per_year', 1);
        if ($ticksPerYear < 1) {
            $ticksPerYear = 1;
        }

        return (int) floor($tick / $ticksPerYear);
    }
}
