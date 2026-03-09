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
        foreach ($settlements as $zoneIndex => $settlement) {
            $pop = (int) ($settlement['population'] ?? 0);
            $surplus = (float) ($settlement['resource_surplus'] ?? 0);
            $consumption = $pop * 0.3;
            $totalSurplus += $surplus;
            $totalConsumption += $consumption;
            if (isset($zones[$zoneIndex]['state']) && is_array($zones[$zoneIndex]['state'])) {
                $zones[$zoneIndex]['state']['economy_consumption'] = round($consumption, 2);
                $zones[$zoneIndex]['state']['economy_surplus'] = round($surplus, 2);
            }
        }

        $stateVector['civilization']['economy'] = [
            'total_surplus' => round($totalSurplus, 2),
            'total_consumption' => round($totalConsumption, 2),
            'updated_tick' => $currentTick,
        ];
        $stateVector['zones'] = $zones;
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("GlobalEconomyEngine: Universe {$universe->id} economy updated at tick {$currentTick}");
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
