<?php

namespace App\Modules\Simulation\Core\Runtime\Systems;

use App\Modules\Simulation\Core\Runtime\Contracts\WorldSystemInterface;
use App\Modules\Simulation\Core\Runtime\Causality\ImpactReport;
use App\Modules\Simulation\Core\Runtime\WorldKernel;
use App\Modules\Simulation\Core\Services\LifecycleService;

class SurvivalSystem implements WorldSystemInterface
{
    public function __construct(
        private readonly LifecycleService $lifecycleService
    ) {}

    public function update(array $context, int $tick): ?ImpactReport
    {
        $report = new ImpactReport('SurvivalSystem', WorldKernel::PHASE_LIFE, WorldKernel::RULE_METABOLISM);
        $actors = $context['state']['actors'] ?? [];
        $universeId = (int) ($context['state']['universe_id'] ?? 0);
        $threshold = config('worldos.intelligence.starvation_threshold', 20.0);

        foreach ($actors as $actor) {
            if (!$actor->isAlive()) continue;

            // 1. Basic metabolism
            $energyCost = config('worldos.intelligence.metabolism_base', 0.5);
            $actor->consumeEnergy($energyCost);
            
            // 2. Check Death via LifecycleService
            if ($this->lifecycleService->checkDeath($actor, $universeId, $tick)) {
                $actor->biography .= " [DIED OF STARVATION AT TICK $tick]";
                
                // V81 Semantic Reporting
                $report->log('system', 'metabolism', 'killed', 'actor', $actor->id, 1.0, 1.0, [
                    'reason' => 'starvation',
                    'tick' => $tick
                ]);
            }
        }

        return $report->hasImpacts() ? $report : null;
    }
}
