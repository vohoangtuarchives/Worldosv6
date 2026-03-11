<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Politics Engine (Tier 11).
 * Power (military, economic, influence), legitimacy, governance. Writes to state_vector['civilization']['politics'].
 */
class PoliticsEngine
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
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['civilization']['politics'])) {
            return;
        }
        $civilization = $stateVector['civilization'] ?? null;
        $settlements = $civilization['settlements'] ?? [];
        if (empty($settlements)) {
            return;
        }

        $totalPop = (int) ($civilization['total_population'] ?? 0);
        $economy = $civilization['economy'] ?? [];
        $surplus = (float) ($economy['total_surplus'] ?? 0);
        $seed = (int) ($universe->seed ?? 0) + $universe->id * 31;
        $stability = 0.5 + 0.2 * min(1.0, $surplus / max(1, $totalPop)) + 0.1 * ($this->detFloat($seed, $currentTick, 0) - 0.5);
        $stability = max(0.0, min(1.0, $stability));
        $militaryPower = 0.2 * $totalPop + 0.3 * $stability;
        $economicPower = min(1.0, $surplus / 10.0);
        $legitimacy = 0.4 + 0.3 * $stability + 0.2 * $economicPower;

        $stateVector['civilization']['politics'] = [
            'military_power' => round($militaryPower, 4),
            'economic_power' => round($economicPower, 4),
            'legitimacy' => round(max(0, min(1, $legitimacy)), 4),
            'stability' => round($stability, 4),
            'updated_tick' => $currentTick,
        ];
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("PoliticsEngine: Universe {$universe->id} politics updated at tick {$currentTick}");
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }

    private function detFloat(int $seed, int $tick, int $salt): float
    {
        $h = crc32($seed . ':' . $tick . ':' . $salt);
        return (float) (($h & 0x7FFFFFFF) / 0x7FFFFFFF);
    }
}
