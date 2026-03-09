<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * War Engine (Tier 12).
 * Casus belli (resource, territory, culture), battle power. Simplified: no multi-civ yet; tracks war readiness / conflict pressure.
 */
class WarEngine
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.war_tick_interval', 30);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $civilization = $stateVector['civilization'] ?? null;
        $politics = $civilization['politics'] ?? [];
        $economy = $civilization['economy'] ?? [];
        $settlements = $civilization['settlements'] ?? [];

        $militaryPower = (float) ($politics['military_power'] ?? 0.2);
        $surplus = (float) ($economy['total_surplus'] ?? 0);
        $stability = (float) ($politics['stability'] ?? 0.5);
        $conflictPressure = (1.0 - $stability) * 0.5 + (1.0 - min(1.0, $surplus / 5.0)) * 0.3;
        $conflictPressure = max(0.0, min(1.0, $conflictPressure));

        $stateVector['civilization']['war'] = [
            'military_power' => round($militaryPower, 4),
            'conflict_pressure' => round($conflictPressure, 4),
            'updated_tick' => $currentTick,
        ];
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("WarEngine: Universe {$universe->id} war metrics updated at tick {$currentTick}");
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
