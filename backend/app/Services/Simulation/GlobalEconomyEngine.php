<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Global Economy Engine (Tier 10).
 * Resource economy per settlement: production, storage, consumption. Simple market/trade proxy.
 * Reads state_vector['civilization']['settlements'], writes economy metrics per zone.
 */
class GlobalEconomyEngine
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
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['civilization']['economy'])) {
            return;
        }
        $civilization = $stateVector['civilization'] ?? null;
        $settlements = $civilization['settlements'] ?? [];
        if (empty($settlements)) {
            return;
        }

        $zones = &$stateVector['zones'];
        if (!is_array($zones)) {
            return;
        }

        $totalSurplus = 0.0;
        $totalConsumption = 0.0;
        $zoneSurpluses = [];
        $numZones = count($settlements);
        foreach ($settlements as $zoneIndex => $settlement) {
            $pop = (int) ($settlement['population'] ?? 0);
            $surplus = (float) ($settlement['resource_surplus'] ?? 0);
            $consumption = $pop * 0.3;
            $totalSurplus += $surplus;
            $totalConsumption += $consumption;
            $zoneSurpluses[(int) $zoneIndex] = $surplus;
            if (isset($zones[$zoneIndex]['state']) && is_array($zones[$zoneIndex]['state'])) {
                $zones[$zoneIndex]['state']['economy_consumption'] = round($consumption, 2);
                $zones[$zoneIndex]['state']['economy_surplus'] = round($surplus, 2);
            }
        }

        // Doc §16: trade_flow (route_capacity × supply × demand proxy), hub_score per zone
        $tradeFlow = $this->computeTradeFlow($totalSurplus, $totalConsumption, $zoneSurpluses, $numZones);
        $hubScores = $this->computeHubScores($zoneSurpluses, $totalSurplus, $numZones);

        $stateVector['civilization']['economy'] = [
            'total_surplus' => round($totalSurplus, 2),
            'total_consumption' => round($totalConsumption, 2),
            'trade_flow' => round($tradeFlow, 4),
            'hub_scores' => $hubScores,
            'updated_tick' => $currentTick,
        ];
        $stateVector['zones'] = $zones;
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("GlobalEconomyEngine: Universe {$universe->id} economy updated at tick {$currentTick}");
    }

    /** Doc §16: trade flow ≈ route_capacity × supply × demand (aggregate proxy). */
    private function computeTradeFlow(float $totalSurplus, float $totalConsumption, array $zoneSurpluses, int $numZones): float
    {
        $routeCapacity = min(1.0, $numZones > 0 ? (float) config('worldos.economy.trade_route_capacity_factor', 0.5) * $numZones : 0);
        $supply = max(0.01, $totalSurplus);
        $demand = max(0.01, $totalConsumption);
        return $routeCapacity * min($supply, $demand) * (1.0 + min($supply, $demand) / max($supply, $demand));
    }

    /** Doc §16: hub_score per zone (connectivity + surplus share). */
    private function computeHubScores(array $zoneSurpluses, float $totalSurplus, int $numZones): array
    {
        $connectivityFactor = (float) config('worldos.economy.hub_connectivity_factor', 0.3);
        $maxSurplus = max(0.01, $totalSurplus);
        $hubScores = [];
        foreach ($zoneSurpluses as $zoneIndex => $surplus) {
            $surplusShare = $surplus / $maxSurplus;
            $connectivity = $numZones > 1 ? ($numZones - 1) / (float) $numZones : 0;
            $hubScores[$zoneIndex] = round($surplusShare * (1.0 - $connectivityFactor) + $connectivityFactor * $connectivity, 4);
        }
        return $hubScores;
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
