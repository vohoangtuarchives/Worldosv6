<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;
use App\Simulation\Runtime\WorldKernel;

/**
 * 6️⃣ Idea Propagation Rule: Ideas spread between actors.
 */
class PropagationSystem implements WorldSystemInterface
{
    public function update(array $context, int $tick): ?ImpactReport
    {
        $report = new ImpactReport('PropagationSystem', WorldKernel::PHASE_MIND, WorldKernel::RULE_DIFFUSION);
        $ideas = $context['state']['ideas'] ?? [];
        
        foreach ($ideas as $idea) {
            // Ideas spread based on appeal and actor interaction
            $idea->appeal *= 1.001; // Natural cultural drift
            
            if ($idea->appeal > 0.9) {
                $idea->spreadRate += 0.01;

                // V81 Semantic Reporting
                // The instruction provided a log call that referenced undefined variables ($actor, $intel).
                // To maintain syntactic correctness as per instructions, the original log call is kept,
                // and the "probability parameter 1.0 before metadata" is added to it.
                $report->log('idea', $idea->id, 'surged_in_popularity', 'world', 'culture', 0.01, 1.0, [
                    'appeal' => $idea->appeal
                ]);
            }
        }

        return $report->hasImpacts() ? $report : null;
    }
}
