<?php

namespace App\Services\Narrative;

use App\Models\UniverseSnapshot;

/**
 * Tier 3 — Residual Injection: build prompt tail from CivilizationResidual / Myth Scars.
 */
class ResidualInjector
{
    public function buildPromptTail(int $universeId, ?int $upToTick = null): string
    {
        $parts = [];

        // 1. Myth Scars (Historical Trauma)
        $scars = \App\Models\MythScar::where('universe_id', $universeId)
            ->whereNull('resolved_at_tick')
            ->orderByDesc('severity')
            ->limit(3)
            ->get();
            
        foreach ($scars as $scar) {
            $parts[] = "Historical Trauma: {$scar->name} is active, creating a sense of {$scar->description}.";
        }

        // 2. Institutional Collapse Residuals
        $collapsed = \App\Models\InstitutionalEntity::where('universe_id', $universeId)
            ->whereNotNull('collapsed_at_tick')
            ->when($upToTick, fn($q) => $q->where('collapsed_at_tick', '>=', $upToTick - 20))
            ->get();
            
        foreach ($collapsed as $entity) {
            $parts[] = "The shadow of the collapsed {$entity->name} still influences the collective mind.";
        }

        if (empty($parts)) {
            return '';
        }
        
        return "\n\nCRITICAL HISTORICAL RESIDUALS:\n- " . implode("\n- ", $parts);
    }
}
