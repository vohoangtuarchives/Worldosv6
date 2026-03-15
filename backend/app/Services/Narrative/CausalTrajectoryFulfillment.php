<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\CausalTrajectory;

/**
 * Checks causal_trajectories at prediction_tick and marks fulfilled based on events.
 */
class CausalTrajectoryFulfillment
{
    /**
     * Evaluate unfulfilled causal_trajectories whose prediction_tick has passed; set fulfilled if heuristic matches.
     */
    public function evaluateForUniverse(int $universeId, int $currentTick): int
    {
        $causal_trajectories = CausalTrajectory::where('universe_id', $universeId)
            ->where('fulfilled', false)
            ->where('prediction_tick', '<=', $currentTick)
            ->get();

        $marked = 0;
        foreach ($causal_trajectories as $causal_trajectory) {
            $events = Chronicle::where('universe_id', $universeId)
                ->whereBetween('from_tick', [$causal_trajectory->prediction_tick - 10, $causal_trajectory->prediction_tick + 10])
                ->get();

            if ($this->heuristicFulfilled($causal_trajectory, $events)) {
                $causal_trajectory->update(['fulfilled' => true]);
                $marked++;
            }
        }
        return $marked;
    }

    /**
     * Simple heuristic: if there are notable events near prediction_tick, consider fulfilled.
     */
    protected function heuristicFulfilled(CausalTrajectory $causal_trajectory, \Illuminate\Support\Collection $events): bool
    {
        $notable = $events->filter(fn ($c) => in_array($c->type ?? '', [
            'civilization_collapse', 'institution_collapse', 'war', 'anomaly', 'death',
        ], true) || ((float) ($c->importance ?? 0)) >= 0.5);
        return $notable->count() >= 1;
    }
}
