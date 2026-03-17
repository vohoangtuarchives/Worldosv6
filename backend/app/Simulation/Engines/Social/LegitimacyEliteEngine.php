<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use Illuminate\Support\Facades\Log;

/**
 * Doc §17: Legitimacy aggregate and elite overproduction from institutions.
 */
final class LegitimacyEliteEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct() {}

    public function phase(): string
    {
        return 'society';
    }

    public function name(): string
    {
        return 'legitimacy_elite';
    }

    public function priority(): int
    {
        return 31;
    }

    public function tickRate(): int
    {
        return (int) \config('worldos.intelligence.politics_tick_interval', 25);
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $institutions = $state->getInstitutionalEntities();
        $legitimacyAggregate = 0.0;
        $eliteCount = 0;

        if (count($institutions) > 0) {
            $legitimacySum = 0.0;
            $founderIds = [];
            $memberSum = 0;

            foreach ($institutions as $inst) {
                $legitimacySum += (float) $inst->legitimacy;
                if ($inst->founder_actor_id) {
                    $founderIds[$inst->founder_actor_id] = true;
                }
                $memberSum += (int) $inst->members;
            }

            $legitimacyAggregate = $legitimacySum / count($institutions);
            $eliteCount = count($founderIds) + (int) min($memberSum * 0.2, 50);
        }

        $actors = $state->getActorEntities();
        $aliveCount = 0;
        foreach ($actors as $actor) {
            if ($actor->isAlive) $aliveCount++;
        }

        $eliteRatio = $aliveCount > 0 ? min(1.0, $eliteCount / $aliveCount) : 0.0;
        $eliteOverproductionThr = (float) \config('worldos.legitimacy.elite_overproduction_threshold', 0.15);
        $overproduction = $eliteRatio > $eliteOverproductionThr ? round($eliteRatio - $eliteOverproductionThr, 4) : 0.0;

        $politics = $state->get('civilization.politics', []);
        $politics['legitimacy_aggregate'] = round(max(0, min(1, $legitimacyAggregate)), 4);
        $politics['elite_ratio'] = round($eliteRatio, 4);
        $politics['elite_overproduction'] = $overproduction;
        $politics['updated_tick'] = $ctx->getTick();

        return new EngineResult([], [
            new WorldRulesUpdateEffect(['civilization.politics' => $politics])
        ], []);
    }
}
