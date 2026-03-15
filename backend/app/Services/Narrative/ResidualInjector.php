<?php

namespace App\Services\Narrative;

use App\Models\UniverseSnapshot;
use App\Services\Narrative\MeaningSeedService;
use Illuminate\Support\Facades\Storage;

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

        // 3. Collective Consciousness (Phase 31)
        $latest = \App\Models\UniverseSnapshot::where('universe_id', $universeId)->orderByDesc('tick')->first();
        $resonance = (float) ($latest?->state_vector['field_resonance_field'] ?? $latest?->state_vector['resonance_field'] ?? 0.0);
        if ($resonance > 0.7) {
            $parts[] = "The Collective Consciousness is vibrating at high resonance ({$resonance}), blurring the line between myth and objective physical reality.";
        }

        // 4. Fate Pressure (Phase 32)
        $fatePressure = (float) ($latest?->state_vector['pressures']['fate_pressure'] ?? 0.0);
        if ($fatePressure > 0.6) {
            $parts[] = "A heavy Fate Pressure ({$fatePressure}) is steering current events toward an inevitable historical recurrence.";
        }

        // 5. V10 Meaning Seeds (Trans-universal Continuity — Phase 75)
        try {
            $sv = $latest?->state_vector ?? [];
            $ancestorIds = (array)($sv['meta']['ancestor_universe_ids'] ?? []);
            foreach ($ancestorIds as $ancestorId) {
                $path = "simulation/meaning_seeds/universe_{$ancestorId}.json";
                if (Storage::disk('local')->exists($path)) {
                    $data = json_decode(Storage::disk('local')->get($path), true);
                    if ($data) {
                        $parts[] = sprintf(
                            'Trans-universal Legacy (Universe #%d, Attractor: %s): Beliefs [%s] remain as inherited echoes.',
                            $data['source_universe'],
                            $data['attractor'] ?? 'unknown',
                            implode(', ', $data['dominant_beliefs'] ?? [])
                        );
                    }
                }
            }
        } catch (\Throwable $e) {
            // Seeds are optional — do not break prompt generation
        }

        if (empty($parts)) {
            return '';
        }
        
        return "\n\nCRITICAL HISTORICAL & METAPHYSICAL RESIDUALS:\n- " . implode("\n- ", $parts);
    }
}
