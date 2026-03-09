<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Intelligence\Services\BiologyMetricsService;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Civilization Engine – settlement layer (Tier 9).
 * Settlement formation (camp → village → town → city by population), governance (tribal → chiefdom → kingdom).
 * Uses population density + resource surplus. Writes to state_vector['civilization'].
 */
class CivilizationSettlementEngine
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected BiologyMetricsService $biologyMetrics
    ) {}

    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.civilization_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $zones = $stateVector['zones'] ?? [];
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $bio = $this->biologyMetrics->forUniverse($universe->id);
        $totalPop = $bio['total_alive'];
        $zoneCount = count($zones);
        $popPerZone = $zoneCount > 0 ? array_fill(0, $zoneCount, (int) floor($totalPop / $zoneCount)) : [];
        $remainder = $zoneCount > 0 ? $totalPop % $zoneCount : 0;
        for ($i = 0; $i < $remainder; $i++) {
            $popPerZone[$i] = ($popPerZone[$i] ?? 0) + 1;
        }

        $thresholds = config('worldos.intelligence.civilization_settlement_thresholds', ['camp' => 0, 'village' => 3, 'town' => 6, 'city' => 12]);
        $settlements = [];
        foreach ($zones as $zoneIndex => $zone) {
            $state = $zone['state'] ?? [];
            $pop = $popPerZone[$zoneIndex] ?? 0;
            $food = (float) ($state['food'] ?? $state['resources'] ?? 0.5);
            $resourceSurplus = max(0, $food - 0.2 * $pop);
            $level = $this->settlementLevel($pop, $thresholds);
            $governance = $this->governanceFromLevel($level);
            $settlements[$zoneIndex] = [
                'level' => $level,
                'governance' => $governance,
                'population' => $pop,
                'resource_surplus' => round($resourceSurplus, 2),
            ];
        }

        $stateVector['civilization'] = [
            'settlements' => $settlements,
            'total_population' => $totalPop,
            'updated_tick' => $currentTick,
        ];
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("CivilizationSettlementEngine: Universe {$universe->id} settlements updated at tick {$currentTick}");
    }

    private function settlementLevel(int $pop, array $thresholds): string
    {
        if ($pop >= ($thresholds['city'] ?? 12)) {
            return 'city';
        }
        if ($pop >= ($thresholds['town'] ?? 6)) {
            return 'town';
        }
        if ($pop >= ($thresholds['village'] ?? 3)) {
            return 'village';
        }
        return 'camp';
    }

    private function governanceFromLevel(string $level): string
    {
        return match ($level) {
            'city' => 'kingdom',
            'town' => 'chiefdom',
            default => 'tribal',
        };
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
