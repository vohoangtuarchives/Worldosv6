<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;

class SurvivalSystem implements WorldSystemInterface
{
    public function update(array $context, int $tick): ?ImpactReport
    {
        $report = new ImpactReport('SurvivalSystem', WorldKernel::PHASE_LIFE, WorldKernel::RULE_METABOLISM);
        $actors = $context['state']['actors'] ?? [];
        $threshold = config('worldos.intelligence.starvation_threshold', 20.0);

        foreach ($actors as $actor) {
            if (!$actor->isAlive) continue;

            $energy = (float)($actor->metrics['energy'] ?? 100);
            
            // Basic metabolism
            $energy -= config('worldos.intelligence.metabolism_base', 0.5);
            
            if ($energy <= 0) {
                $actor->isAlive = false;
                $actor->biography .= " [DIED OF STARVATION AT TICK $tick]";
                
                // V81 Semantic Reporting
                $report->log('system', 'metabolism', 'killed', 'actor', $actor->id, 1.0, 1.0, [
                    'reason' => 'starvation',
                    'tick' => $tick
                ]);
            }
            
            $actor->metrics['energy'] = $energy;
        }

        return $report->hasImpacts() ? $report : null;
    }
}
