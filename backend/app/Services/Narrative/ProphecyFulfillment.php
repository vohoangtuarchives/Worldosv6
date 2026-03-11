<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Prophecy;

/**
 * Checks prophecies at prediction_tick and marks fulfilled based on events.
 */
class ProphecyFulfillment
{
    /**
     * Evaluate unfulfilled prophecies whose prediction_tick has passed; set fulfilled if heuristic matches.
     */
    public function evaluateForUniverse(int $universeId, int $currentTick): int
    {
        $prophecies = Prophecy::where('universe_id', $universeId)
            ->where('fulfilled', false)
            ->where('prediction_tick', '<=', $currentTick)
            ->get();

        $marked = 0;
        foreach ($prophecies as $prophecy) {
            $events = Chronicle::where('universe_id', $universeId)
                ->whereBetween('from_tick', [$prophecy->prediction_tick - 10, $prophecy->prediction_tick + 10])
                ->get();

            if ($this->heuristicFulfilled($prophecy, $events)) {
                $prophecy->update(['fulfilled' => true]);
                $marked++;
            }
        }
        return $marked;
    }

    /**
     * Simple heuristic: if there are notable events near prediction_tick, consider fulfilled.
     */
    protected function heuristicFulfilled(Prophecy $prophecy, \Illuminate\Support\Collection $events): bool
    {
        $notable = $events->filter(fn ($c) => in_array($c->type ?? '', [
            'civilization_collapse', 'institution_collapse', 'war', 'anomaly', 'death',
        ], true) || ((float) ($c->importance ?? 0)) >= 0.5);
        return $notable->count() >= 1;
    }
}
