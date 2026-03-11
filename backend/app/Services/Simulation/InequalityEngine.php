<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Inequality dynamics (Doc §7).
 * Computes gini-like index and surplus concentration from settlements; writes state_vector.civilization.economy.inequality.
 * Runs after GlobalEconomyEngine so economy.settlements/surplus data exists.
 */
class InequalityEngine
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['civilization']['economy']['inequality'])) {
            return;
        }

        $civilization = $stateVector['civilization'] ?? null;
        $economy = $civilization['economy'] ?? null;
        $settlements = $civilization['settlements'] ?? [];
        if (empty($settlements)) {
            return;
        }

        $surpluses = [];
        $populations = [];
        foreach ($settlements as $zoneIndex => $s) {
            $surpluses[] = max(0.0, (float) ($s['resource_surplus'] ?? 0));
            $populations[] = max(0, (int) ($s['population'] ?? 0));
        }

        $gini = $this->computeGiniFromShares($surpluses);
        $surplusConcentration = $this->surplusConcentration($surpluses);
        $totalPop = array_sum($populations);
        $eliteShare = $totalPop > 0 ? min(1.0, (float) config('worldos.inequality.elite_population_share', 0.1) * (1.0 + (1.0 - $gini))) : 0.0;

        $inequality = [
            'gini_index' => round($gini, 4),
            'surplus_concentration' => round($surplusConcentration, 4),
            'elite_share_proxy' => round($eliteShare, 4),
            'updated_tick' => $currentTick,
        ];

        $stateVector['civilization']['economy'] = array_merge($economy ?? [], ['inequality' => $inequality]);
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("InequalityEngine: Universe {$universe->id} inequality updated at tick {$currentTick}");
    }

    /** Gini-like from surplus per zone (0 = equal, 1 = maximally unequal). */
    private function computeGiniFromShares(array $surpluses): float
    {
        if (count($surpluses) < 2) {
            return 0.0;
        }
        $total = array_sum($surpluses);
        if ($total <= 0) {
            return 0.0;
        }
        sort($surpluses, SORT_NUMERIC);
        $n = count($surpluses);
        $cumsum = 0;
        $sumB = 0;
        for ($i = 0; $i < $n; $i++) {
            $cumsum += $surpluses[$i];
            $sumB += $cumsum;
        }
        $gini = (float) (1.0 - 2.0 * $sumB / ($n * $total));
        return max(0.0, min(1.0, $gini));
    }

    /** Share of total surplus held by top fraction of zones (concentration). */
    private function surplusConcentration(array $surpluses): float
    {
        if (empty($surpluses)) {
            return 0.0;
        }
        $total = array_sum($surpluses);
        if ($total <= 0) {
            return 0.0;
        }
        rsort($surpluses, SORT_NUMERIC);
        $topCount = max(1, (int) ceil(count($surpluses) * 0.2));
        $topSum = array_sum(array_slice($surpluses, 0, $topCount));
        return min(1.0, $topSum / $total);
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
