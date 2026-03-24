<?php
namespace App\Modules\Simulation\Core\Engines\Social;

use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Engines\EngineInterface;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;

/**
 * PsychologyEngine — Tâm lý tập thể: morale, unrest per zone.
 *
 * Tổng hợp từ resource scarcity, inequality, legitimacy, war_pressure.
 */
class PsychologyEngine implements EngineInterface
{
    use DefaultSimulationEnginePhase;

    public function name(): string { return 'psychology'; }
    public function phase(): string { return 'social'; }
    public function priority(): int { return 5; }
    public function tickRate(): int { return 1; }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $result = new EngineResult();
        $tick   = $ctx->getTick();

        if ($tick % 10 !== 0) { return $result; }

        $zones      = $state->getZones();
        $gini       = (float) $state->get('economy.gini', 0.3);
        $legitimacy = (float) $state->get('politics.legitimacy', 0.7);

        $updatedZones = [];

        foreach ($zones as $idx => $zone) {
            $s = $zone['state'] ?? [];
            $population = (float) ($s['population'] ?? 0);
            $resource   = (float) ($s['resource'] ?? 0);
            $warPressure = (float) ($s['war_pressure'] ?? 0);

            // Scarcity factor: mức thiếu hụt resource
            $need = $population * 2.0;
            $scarcity = $need > 0 ? max(0.0, 1.0 - ($resource / $need)) : 0.0;

            // Morale: higher is better
            $morale = 1.0
                - $scarcity * 0.35
                - $gini * 0.2
                - $warPressure * 0.25
                - (1.0 - $legitimacy) * 0.2;
            $morale = max(0.0, min(1.0, $morale));

            // Unrest: combination of low morale + inequality + low legitimacy
            $unrest = (1.0 - $morale) * $gini * (1.0 - $legitimacy);
            $unrest = max(0.0, min(1.0, $unrest));

            $s['morale'] = round($morale, 4);
            $s['unrest'] = round($unrest, 4);
            $zone['state'] = $s;
            $updatedZones[] = $zone;
        }

        if (!empty($updatedZones)) {
            $result->stateChanges[] = ['zones' => $updatedZones];
        }

        return $result;
    }
}
