<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\World;
use Illuminate\Support\Collection;

/**
 * Multiverse Scheduler Engine: selects which universes get tick budget in a cycle.
 * Priority = weighted sum of novelty, complexity, civilization, entropy (higher = tick first).
 * When tick_budget > 0, only top-N universes per world are scheduled.
 */
class MultiverseSchedulerEngine
{
    public function __construct() {}

    /**
     * Return universes to tick for this world, ordered by priority (highest first).
     * If $tickBudget is null, use config. If 0, no limit (return all active).
     */
    public function schedule(World $world, ?int $tickBudget = null): Collection
    {
        $budget = $tickBudget ?? (int) config('worldos.scheduler.tick_budget', 0);

        $universes = Universe::where('world_id', $world->id)
            ->whereIn('status', ['active', 'running'])
            ->get();

        if ($universes->isEmpty()) {
            return collect();
        }

        $scored = $universes->map(function (Universe $u) {
            return [
                'universe' => $u,
                'priority' => $this->computePriority($u),
            ];
        })->sortByDesc('priority')->values();

        if ($budget > 0) {
            return $scored->take($budget)->pluck('universe');
        }

        return $scored->pluck('universe');
    }

    /**
     * Return universes with priority and order_index for dashboard/simulation-status API.
     * Same as schedule() but returns full scored items: [universe, priority, order_index].
     */
    public function scheduleWithScores(World $world, ?int $tickBudget = null): Collection
    {
        $budget = $tickBudget ?? (int) config('worldos.scheduler.tick_budget', 0);

        $universes = Universe::where('world_id', $world->id)
            ->whereIn('status', ['active', 'running'])
            ->get();

        if ($universes->isEmpty()) {
            return collect();
        }

        $scored = $universes->map(function (Universe $u) {
            return [
                'universe' => $u,
                'priority' => $this->computePriority($u),
            ];
        })->sortByDesc('priority')->values();

        if ($budget > 0) {
            $scored = $scored->take($budget);
        }

        return $scored->map(function ($item, $index) {
            $item['order_index'] = $index + 1;
            return $item;
        })->values();
    }

    /**
     * Priority score from state_vector and universe (novelty proxy, complexity, civilization, entropy).
     */
    protected function computePriority(Universe $universe): float
    {
        $weights = config('worldos.scheduler.priority_weights', [
            'novelty' => 0.25,
            'complexity' => 0.30,
            'civilization' => 0.25,
            'entropy' => 0.20,
        ]);

        $vec = (array) ($universe->state_vector ?? []);
        $zones = (array) ($vec['zones'] ?? []);
        $complexity = min(1.0, count($zones) / 12.0);
        $civ = (array) ($vec['civilization'] ?? []);
        $settlements = (array) ($civ['settlements'] ?? []);
        $civilization = min(1.0, count($settlements) / 8.0);
        $entropy = (float) ($universe->entropy ?? $vec['entropy'] ?? 0.5);
        $entropyScore = 1.0 - $entropy;
        $novelty = $this->noveltyFromState($vec);

        $priority = ($weights['novelty'] ?? 0.25) * $novelty
            + ($weights['complexity'] ?? 0.30) * $complexity
            + ($weights['civilization'] ?? 0.25) * $civilization
            + ($weights['entropy'] ?? 0.20) * $entropyScore;

        return round(min(1.0, max(0.0, $priority)), 4);
    }

    protected function noveltyFromState(array $vec): float
    {
        $fields = (array) ($vec['fields'] ?? []);
        if (empty($fields)) {
            return 0.5;
        }
        $names = ['survival', 'power', 'wealth', 'knowledge', 'meaning'];
        $sum = 0.0;
        $n = 0;
        foreach ($names as $f) {
            $v = (float) ($fields[$f] ?? 0.5);
            $sum += ($v - 0.5) ** 2;
            $n++;
        }
        return min(1.0, $n > 0 ? sqrt($sum / $n) : 0.5);
    }
}
