<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;
use App\Simulation\Runtime\WorldKernel;

/**
 * 4️⃣ Alliance Rule: Actors cooperate for mutual benefit.
 */
class AllianceSystem implements WorldSystemInterface
{
    public function update(array $context, int $tick): ?ImpactReport
    {
        $report = new ImpactReport('AllianceSystem', WorldKernel::PHASE_SOCIAL, WorldKernel::RULE_COHESION);
        $actors = $context['state']['actors'] ?? [];
        
        // Simple heuristic: High empathy actors near each other form trust
        foreach ($actors as $actor) {
            if (!$actor->isAlive) continue;
            
            $empathy = (float)($actor->traits[4] ?? 0.5); // Empathy trait
            if ($empathy > 0.7) {
                $actor->incrementInfluence(0.01);
                // Potential for group formation logic here
            }
        }

        return $report->hasImpacts() ? $report : null;
    }
}
