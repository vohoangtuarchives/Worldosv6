<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Actor;
use App\Models\InstitutionalEntity;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Doc §17: Legitimacy aggregate and elite overproduction from institutions.
 * Reads InstitutionalEntity (legitimacy, members, founders); computes legitimacy_aggregate and elite_ratio.
 * Writes state_vector.civilization.politics.legitimacy_aggregate, elite_ratio (or merges into politics).
 */
class LegitimacyEliteService
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.politics_tick_interval', 25);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['civilization']['politics']['legitimacy_aggregate'])) {
            return;
        }

        $institutions = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $legitimacyAggregate = 0.0;
        $eliteCount = 0;
        if ($institutions->isNotEmpty()) {
            $legitimacyAggregate = (float) $institutions->avg('legitimacy');
            $founderIds = $institutions->pluck('founder_actor_id')->unique()->filter()->count();
            $memberSum = $institutions->sum('members');
            $eliteCount = $founderIds + (int) min($memberSum * 0.2, 50);
        }

        $totalActors = Actor::where('universe_id', $universe->id)->where('is_alive', true)->count();
        $eliteRatio = $totalActors > 0 ? min(1.0, $eliteCount / $totalActors) : 0.0;
        $eliteOverproduction = (float) config('worldos.legitimacy.elite_overproduction_threshold', 0.15);
        $overproduction = $eliteRatio > $eliteOverproduction ? round($eliteRatio - $eliteOverproduction, 4) : 0.0;

        $politics = $stateVector['civilization']['politics'] ?? [];
        $politics['legitimacy_aggregate'] = round(max(0, min(1, $legitimacyAggregate)), 4);
        $politics['elite_ratio'] = round($eliteRatio, 4);
        $politics['elite_overproduction'] = $overproduction;
        $politics['updated_tick'] = $currentTick;

        $stateVector['civilization']['politics'] = $politics;
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("LegitimacyEliteService: Universe {$universe->id} legitimacy/elite updated at tick {$currentTick}");
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
