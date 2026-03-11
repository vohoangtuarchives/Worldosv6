<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * War Engine (Tier 12). Doc §12.
 * Military model (soldiers, training, technology, morale); war stages (Mobilization → Campaign → Battles → Attrition → Negotiation).
 * Casus belli (resource, territory, culture), battle power.
 */
class WarEngine
{
    public const WAR_STAGE_MOBILIZATION = 'mobilization';
    public const WAR_STAGE_CAMPAIGN = 'campaign';
    public const WAR_STAGE_BATTLES = 'battles';
    public const WAR_STAGE_ATTRITION = 'attrition';
    public const WAR_STAGE_NEGOTIATION = 'negotiation';

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
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['civilization']['war'])) {
            return;
        }
        $civilization = $stateVector['civilization'] ?? null;
        $politics = $civilization['politics'] ?? [];
        $economy = $civilization['economy'] ?? [];
        $settlements = $civilization['settlements'] ?? [];

        $militaryPower = (float) ($politics['military_power'] ?? 0.2);
        $surplus = (float) ($economy['total_surplus'] ?? 0);
        $stability = (float) ($politics['stability'] ?? 0.5);
        $conflictPressure = (1.0 - $stability) * 0.5 + (1.0 - min(1.0, $surplus / 5.0)) * 0.3;
        $conflictPressure = max(0.0, min(1.0, $conflictPressure));

        $existing = $stateVector['civilization']['war'] ?? [];
        $army = $existing['army'] ?? [];
        $soldiers = (int) ($army['soldiers'] ?? 0);
        $training = (float) ($army['training'] ?? 0.5);
        $technology = (float) ($army['technology'] ?? 0.3);
        $morale = (float) ($army['morale'] ?? 0.7);
        $combatPower = $soldiers > 0 ? $soldiers * $training * $technology * $morale : 0.0;

        $stage = $existing['war_stage'] ?? self::WAR_STAGE_MOBILIZATION;
        if ($conflictPressure > 0.6 && $stage === self::WAR_STAGE_MOBILIZATION) {
            $stage = self::WAR_STAGE_CAMPAIGN;
        } elseif ($conflictPressure > 0.4 && $stage === self::WAR_STAGE_CAMPAIGN) {
            $stage = self::WAR_STAGE_BATTLES;
        } elseif ($conflictPressure < 0.3 && in_array($stage, [self::WAR_STAGE_BATTLES, self::WAR_STAGE_ATTRITION], true)) {
            $stage = self::WAR_STAGE_NEGOTIATION;
        }

        $stateVector['civilization']['war'] = [
            'military_power' => round($militaryPower, 4),
            'conflict_pressure' => round($conflictPressure, 4),
            'updated_tick' => $currentTick,
            'army' => [
                'soldiers' => $soldiers,
                'training' => round($training, 4),
                'technology' => round($technology, 4),
                'morale' => round($morale, 4),
                'combat_power' => round($combatPower, 4),
            ],
            'war_stage' => $stage,
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
