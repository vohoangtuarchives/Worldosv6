<?php

namespace App\Services\Simulation;

use App\Simulation\Support\SimulationRandom;

/**
 * ActorDecisionEngine — Phase 2.
 * Input: traits, capabilities, environment (entropy, stability, war_pressure), age, culture.
 * Output: action_distribution [action_type => probability]. Roll yields one action.
 */
class ActorDecisionEngine
{
    /** Trait indices: Dom=0, Amb=1, Cur=8, Rsk=10, Pra=7, Dog=9, Coe=2, Emp=4. */
    public function getActionDistribution(
        array $traits,
        array $capabilities,
        array $environment,
        int $currentTick,
        int $birthTick
    ): array {
        $actions = config('worldos.actor_decision.action_types', [
            'write', 'teach', 'explore', 'war', 'meditate', 'create_religion', 'build', 'govern', 'trade', 'rest',
        ]);
        $scores = array_fill_keys($actions, 0.1); // base weight so no zero

        $intellect = (float) ($capabilities['intellect'] ?? 0.5);
        $charisma = (float) ($capabilities['charisma'] ?? 0.5);
        $creativity = (float) ($capabilities['creativity'] ?? 0.5);
        $cur = (float) ($traits[8] ?? 0.5);
        $dom = (float) ($traits[0] ?? 0.5);
        $pra = (float) ($traits[7] ?? 0.5);
        $rsk = (float) ($traits[10] ?? 0.5);
        $emp = (float) ($traits[4] ?? 0.5);

        $entropy = (float) ($environment['entropy'] ?? 0.5);
        $stability = (float) ($environment['stability_index'] ?? 0.5);
        $warPressure = (float) ($environment['war_pressure'] ?? 0);

        // write: high curiosity + intellect + creativity
        $scores['write'] += $cur * 0.4 + $intellect * 0.3 + $creativity * 0.4;
        // teach: high empathy + intellect
        $scores['teach'] += $emp * 0.4 + $intellect * 0.4;
        // explore: high curiosity + risk
        $scores['explore'] += $cur * 0.4 + $rsk * 0.4;
        // war: high dominance + war_pressure
        $scores['war'] += $dom * 0.3 + $warPressure * 0.5;
        // meditate: low war_pressure, high pragmatism
        $scores['meditate'] += (1.0 - $warPressure) * 0.3 + $pra * 0.3;
        // create_religion: high creativity + low stability (meaning crisis)
        $scores['create_religion'] += $creativity * 0.3 + (1.0 - $stability) * 0.2;
        // build: high pragmatism
        $scores['build'] += $pra * 0.4;
        // govern: high charisma + authority (from capabilities if present)
        $scores['govern'] += $charisma * 0.3 + (float) ($capabilities['authority'] ?? 0.5) * 0.3;
        // trade: medium risk + stability
        $scores['trade'] += $rsk * 0.2 + $stability * 0.2;
        // rest: default sink
        $scores['rest'] += 0.2;

        $total = (float) array_sum($scores);
        if ($total <= 0) {
            $total = 1.0;
        }
        $dist = [];
        foreach ($scores as $action => $s) {
            $dist[$action] = round($s / $total, 4);
        }
        // Normalize to sum 1
        $sum = array_sum($dist);
        if ($sum > 0) {
            foreach ($dist as $k => $v) {
                $dist[$k] = round($v / $sum, 4);
            }
        }
        return $dist;
    }

    /**
     * Roll one action from distribution using seeded RNG.
     */
    public function rollAction(array $actionDistribution, SimulationRandom $rng): string
    {
        $r = $rng->nextFloat();
        $cum = 0.0;
        foreach ($actionDistribution as $action => $prob) {
            $cum += $prob;
            if ($r < $cum) {
                return $action;
            }
        }
        $keys = array_keys($actionDistribution);
        return $keys[array_key_last($keys)] ?? 'rest';
    }

    /** Actions that may trigger artifact creation. */
    public function isArtifactEligibleAction(string $action): bool
    {
        return in_array($action, ['write', 'create_religion', 'build'], true);
    }
}
