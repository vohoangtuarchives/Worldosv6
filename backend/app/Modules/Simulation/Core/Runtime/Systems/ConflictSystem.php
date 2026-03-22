<?php

namespace App\Modules\Simulation\Core\Runtime\Systems;

use App\Modules\Simulation\Core\Runtime\Contracts\WorldSystemInterface;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Runtime\Causality\ImpactReport;
use App\Modules\Simulation\Core\Runtime\WorldKernel;

/**
 * 5️⃣ Conflict Rule: Clash of interests leads to war/instability.
 */
class ConflictSystem implements WorldSystemInterface
{
    public function update(array $context, int $tick): ?ImpactReport
    {
        $report = new ImpactReport('ConflictSystem', WorldKernel::PHASE_META, WorldKernel::RULE_CONFLICT);
        $entropy = $context['state']['entropy'] ?? 0.0;
        $resources = $context['state']['resources'] ?? [];
        
        // High scarcity = high conflict
        $avgScarcity = collect($resources)->avg('scarcity') ?? 0.5;
        
        if ($avgScarcity > 0.8) {
            // Note: We report the impact, but WorldKernel must apply global scalar changes
            $report->log('system', 'resource_scarcity', 'increased_instability', 'world', 'entropy', 0.05, 1.0, [
                'avg_scarcity' => $avgScarcity,
                'mutation' => ['entropy' => $entropy + 0.05]
            ]);
        }

        return $report->hasImpacts() ? $report : null;
    }
}
