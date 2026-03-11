<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use Illuminate\Support\Facades\Cache;

/**
 * Export simulation metrics in Prometheus text format (Doc §31).
 * Exposes tick_duration_ms (from cache or latest snapshot), event_queue_depth placeholder.
 */
final class SimulationMetricsExporter
{
    public function toPrometheusText(): string
    {
        $lines = [
            '# HELP worldos_tick_duration_ms Duration of last advance (ms per tick).',
            '# TYPE worldos_tick_duration_ms gauge',
        ];

        $universes = Universe::whereIn('status', ['active', 'halted'])->get(['id', 'state_vector']);
        foreach ($universes as $u) {
            $ms = Cache::get("worldos.tick_duration_ms.{$u->id}");
            if ($ms !== null) {
                $lines[] = sprintf('worldos_tick_duration_ms{universe_id="%d"} %s', $u->id, number_format((float) $ms, 2, '.', ''));
            }
        }

        $lines[] = '';
        $lines[] = '# HELP worldos_discovery_fitness Civilization discovery fitness (Doc §36).';
        $lines[] = '# TYPE worldos_discovery_fitness gauge';
        foreach ($universes as $u) {
            $sv = is_array($u->state_vector) ? $u->state_vector : (json_decode($u->state_vector ?? '{}', true) ?? []);
            $fitness = $sv['civilization']['discovery']['fitness'] ?? null;
            if ($fitness !== null && is_numeric($fitness)) {
                $lines[] = sprintf('worldos_discovery_fitness{universe_id="%d"} %s', $u->id, number_format((float) $fitness, 4, '.', ''));
            }
        }

        $lines[] = '';
        $lines[] = '# HELP worldos_legacy_entity_count Supreme entities count (Doc §11 great_person_legacy).';
        $lines[] = '# TYPE worldos_legacy_entity_count gauge';
        foreach ($universes as $u) {
            $sv = is_array($u->state_vector) ? $u->state_vector : (json_decode($u->state_vector ?? '{}', true) ?? []);
            $count = $sv['great_person_legacy']['supreme_entity_count'] ?? null;
            if ($count !== null && is_numeric($count)) {
                $lines[] = sprintf('worldos_legacy_entity_count{universe_id="%d"} %d', $u->id, (int) $count);
            }
        }

        $lines[] = '';
        $lines[] = '# HELP worldos_event_queue_depth Event queue depth (placeholder).';
        $lines[] = '# TYPE worldos_event_queue_depth gauge';
        $lines[] = 'worldos_event_queue_depth 0';

        return implode("\n", $lines);
    }
}
