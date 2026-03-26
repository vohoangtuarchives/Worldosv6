<?php

namespace App\Modules\WorldOS\Http\Resources\Support;

use App\Models\MythScar;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

final class WorldOsResourceSupport
{
    public static function normalizeUniverseStatus(?string $status): string
    {
        return match ($status) {
            'active' => 'active',
            'forked' => 'forked',
            'inactive', 'paused', 'archived' => 'paused',
            default => 'paused',
        };
    }

    public static function normalizeBranchStatus(?string $status): string
    {
        return match (self::normalizeUniverseStatus($status)) {
            'active' => 'stable',
            'forked' => 'volatile',
            default => 'observed',
        };
    }

    public static function chronicleType(?string $type): string
    {
        return match ($type) {
            'war', 'battle', 'collapse', 'conflict' => 'conflict',
            'revelation', 'research', 'innovation', 'discovery' => 'discovery',
            'regime', 'council', 'dynasty', 'institution' => 'institution',
            default => 'transition',
        };
    }

    public static function scarSeverity(float|int|string|null $severity): string
    {
        $value = is_numeric($severity) ? (float) $severity : 0.0;

        return match (true) {
            $value >= 0.75 => 'high',
            $value <= 0.3 => 'low',
            default => 'medium',
        };
    }

    public static function anomalyCount(Universe $universe): int
    {
        return (int) MythScar::query()
            ->where('universe_id', $universe->id)
            ->whereNull('resolved_at_tick')
            ->count();
    }

    public static function stabilityForUniverse(Universe $universe, ?UniverseSnapshot $latestSnapshot = null): float
    {
        $structuralCoherence = (float) ($universe->structural_coherence ?? 0);
        if ($structuralCoherence > 0) {
            return round($structuralCoherence * 100, 2);
        }

        return round((float) ($latestSnapshot?->stability_index ?? 0) * 100, 2);
    }

    public static function decodeList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(
                static fn (mixed $item) => is_scalar($item) ? trim((string) $item) : null,
                $value
            )));
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            return self::decodeList($decoded);
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    public static function toMetricArray(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }

    public static function numericMetricDeltas(array $from, array $to): array
    {
        $deltas = [];

        foreach (array_unique(array_merge(array_keys($from), array_keys($to))) as $key) {
            if (! is_numeric($from[$key] ?? null) || ! is_numeric($to[$key] ?? null)) {
                continue;
            }

            $deltas[$key] = round((float) $to[$key] - (float) $from[$key], 4);
        }

        ksort($deltas);

        return $deltas;
    }
}
