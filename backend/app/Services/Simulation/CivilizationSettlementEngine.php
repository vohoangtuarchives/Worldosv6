<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Intelligence\Services\BiologyMetricsService;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Civilization Engine – settlement layer (Tier 9).
 * Settlement formation (camp → village → town → city by population), governance (tribal → chiefdom → kingdom).
 * Uses population from state_vector (engine-authoritative) when present, else Actor count (BiologyMetrics).
 * So "con người" in simulation state always produce civilization layer.
 */
class CivilizationSettlementEngine
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected BiologyMetricsService $biologyMetrics
    ) {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.civilization_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        if (config('worldos.simulation.rust_authoritative', false) && $state->get('civilization')) {
            return;
        }

        $zones = $state->get('zones');
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $totalPopFromState = $this->getTotalPopulationFromState($state->toArray(), $zones);
        $universeId = (int) $state->get('universe_id', 0);
        $bio = $this->biologyMetrics->forUniverse($universeId);
        $totalPop = $totalPopFromState > 0 ? $totalPopFromState : $bio['total_alive'];

        $zoneCount = count($zones);
        $popPerZone = $this->distributePopulationPerZone($zones, $totalPop, $zoneCount);

        $thresholds = config('worldos.intelligence.civilization_settlement_thresholds', ['camp' => 0, 'village' => 3, 'town' => 6, 'city' => 12]);
        $settlements = [];
        foreach ($zones as $zoneIndex => $zone) {
            $zoneState = $zone['state'] ?? [];
            $pop = (int) ($popPerZone[$zoneIndex] ?? 0);
            $food = (float) ($zoneState['food'] ?? $zoneState['resources'] ?? 0.5);
            $resourceSurplus = max(0, $food - 0.2 * $pop);
            $level = $this->settlementLevel($pop, $thresholds);
            $governance = $this->governanceFromLevel($level);
            $infra = $zoneState['infrastructure'] ?? [];
            $settlements[$zoneIndex] = [
                'level' => $level,
                'governance' => $governance,
                'population' => $pop,
                'resource_surplus' => round($resourceSurplus, 2),
                'infrastructure' => [
                    'roads' => (float) ($infra['roads'] ?? 0.5),
                    'ports' => (float) ($infra['ports'] ?? 0.2),
                    'water_supply' => (float) ($infra['water_supply'] ?? 0.5),
                    'sanitation' => (float) ($infra['sanitation'] ?? 0.4),
                    'energy' => (float) ($infra['energy'] ?? 0.3),
                ],
            ];
        }

        $state->set('civilization', [
            'settlements' => $settlements,
            'total_population' => $totalPop,
            'updated_tick' => $currentTick,
        ]);
        
        Log::debug("CivilizationSettlementEngine: Universe {$universeId} settlements updated at tick {$currentTick}");
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // This method will be deprecated. For now, it's just a placeholder.
        // The SimulationTickPipeline handles the new runWithState logic.
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

    /**
     * Population from simulation state (engine/Rust). Prefer this so "humans" in state always yield civilization.
     * Sources: state_vector['population'] (scalar or ['total']), or sum of zones[].state.population_proxy.
     */
    private function getTotalPopulationFromState(array $stateVector, array $zones): int
    {
        $popLayer = $stateVector['population'] ?? null;
        if (is_numeric($popLayer)) {
            return max(0, (int) $popLayer);
        }
        if (is_array($popLayer) && isset($popLayer['total'])) {
            return max(0, (int) $popLayer['total']);
        }
        $sum = 0;
        foreach ($zones as $zone) {
            $state = $zone['state'] ?? [];
            $proxy = $state['population_proxy'] ?? $state['population'] ?? null;
            if (is_numeric($proxy)) {
                $sum += (int) round((float) $proxy);
            }
        }
        return max(0, $sum);
    }

    /** @return array<int, int> zoneIndex => population */
    private function distributePopulationPerZone(array $zones, int $totalPop, int $zoneCount): array
    {
        if ($zoneCount <= 0) {
            return [];
        }
        $perZone = array_fill(0, $zoneCount, (int) floor($totalPop / $zoneCount));
        $remainder = $totalPop % $zoneCount;
        for ($i = 0; $i < $remainder; $i++) {
            $perZone[$i] = ($perZone[$i] ?? 0) + 1;
        }
        return $perZone;
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
