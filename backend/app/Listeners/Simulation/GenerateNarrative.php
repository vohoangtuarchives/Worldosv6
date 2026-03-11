<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Models\Chronicle;
use App\Services\Narrative\NarrativeScheduler;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class GenerateNarrative implements ShouldQueue
{
    public function __construct(
        protected NarrativeScheduler $narrativeScheduler
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;

        $fromTick = (int) $universe->current_tick;
        $toTick = (int) $snapshot->tick;
        $ticks = (int) ($event->engineResponse['_ticks'] ?? 1);
        if ($fromTick >= $toTick && $ticks > 0) {
            $fromTick = max(0, $toTick - $ticks);
        }

        if ($toTick <= $fromTick) {
            return;
        }

        $chronicleIds = Chronicle::where('universe_id', $universe->id)
            ->whereNull('content')
            ->whereNotNull('raw_payload')
            ->where(function ($q) use ($fromTick, $toTick) {
                $q->whereBetween('from_tick', [$fromTick, $toTick])
                    ->orWhereBetween('to_tick', [$fromTick, $toTick]);
            })
            ->limit(100)
            ->pluck('id')
            ->all();

        if (!empty($chronicleIds)) {
            try {
                $this->narrativeScheduler->scheduleEvent($universe->id, $chronicleIds, 1);
            } catch (\Throwable $e) {
                Log::error("GenerateNarrative: schedule event failed: " . $e->getMessage());
            }
        }
    }
}
