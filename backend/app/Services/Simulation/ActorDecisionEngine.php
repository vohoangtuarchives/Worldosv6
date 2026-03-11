<?php

namespace App\Services\Simulation;

use App\Simulation\Support\SimulationRandom;

/**
 * ActorDecisionEngine — Phase 2.
 * Input: traits, capabilities, environment (entropy, stability, war_pressure, optional belief), age, culture.
 * Output: action_distribution [action_type => probability]. Roll yields one action.
 * Belief (from narrative loop): has_religion, has_prophecy_belief, legend_level — adjust weights.
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

        // Belief from narrative loop (religion, prophecy, legend)
        $belief = $environment['belief'] ?? [];
        $hasReligion = !empty($belief['has_religion']);
        $hasProphecyBelief = !empty($belief['has_prophecy_belief']);
        $legendLevel = (int) ($belief['legend_level'] ?? 0);

        // write: high curiosity + intellect + creativity
        $scores['write'] += $cur * 0.4 + $intellect * 0.3 + $creativity * 0.4;
        // teach: high empathy + intellect
        $scores['teach'] += $emp * 0.4 + $intellect * 0.4;
        // explore: high curiosity + risk (reduce if actor believes prophecy — more cautious)
        $scores['explore'] += $cur * 0.4 + $rsk * 0.4;
        if ($hasProphecyBelief) {
            $scores['explore'] -= 0.15;
        }
        // war: high dominance + war_pressure; if has religion, slight boost
        $scores['war'] += $dom * 0.3 + $warPressure * 0.5;
        if ($hasReligion) {
            $scores['war'] += 0.1;
        }
        // meditate: low war_pressure, high pragmatism; boost if has religion
        $scores['meditate'] += (1.0 - $warPressure) * 0.3 + $pra * 0.3;
        if ($hasReligion) {
            $scores['meditate'] += 0.2;
        }
        // create_religion: high creativity + low stability; boost if already has religion
        $scores['create_religion'] += $creativity * 0.3 + (1.0 - $stability) * 0.2;
        if ($hasReligion) {
            $scores['create_religion'] += 0.25;
        }
        // build: high pragmatism
        $scores['build'] += $pra * 0.4;
        // govern: high charisma + authority; boost from legend_level (heroes govern)
        $scores['govern'] += $charisma * 0.3 + (float) ($capabilities['authority'] ?? 0.5) * 0.3;
        if ($legendLevel >= 2) {
            $scores['govern'] += 0.1 * min(3, $legendLevel);
        }
        // trade: medium risk + stability; slightly reduce if believes prophecy (defensive)
        $scores['trade'] += $rsk * 0.2 + $stability * 0.2;
        if ($hasProphecyBelief) {
            $scores['trade'] -= 0.05;
        }
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
