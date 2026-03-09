<?php

namespace App\Services\Simulation;

use App\Models\Chronicle;
use App\Models\Universe;

/**
 * History Engine (Tier 13).
 * Aggregates Chronicle events into a queryable timeline: collapse events, phase transitions,
 * settlements, wars, civilization rise/fall. For API/dashboard.
 */
class HistoryEngine
{
    public function getTimeline(Universe $universe, int $limit = null): array
    {
        $limit = $limit ?? (int) config('worldos.intelligence.history_timeline_limit', 100);
        $chronicles = Chronicle::query()
            ->where('universe_id', $universe->id)
            ->orderByDesc('from_tick')
            ->limit($limit)
            ->get();

        $timeline = [];
        foreach ($chronicles as $c) {
            $timeline[] = [
                'from_tick' => $c->from_tick,
                'to_tick' => $c->to_tick,
                'type' => $c->type,
                'content' => $c->content,
                'payload' => $c->raw_payload ?? [],
            ];
        }
        return array_reverse($timeline);
    }

    /**
     * Group timeline entries by type for dashboard (collapse, phase_transition, civilization_collapse, etc.).
     */
    public function getTimelineByType(Universe $universe, int $limit = null): array
    {
        $timeline = $this->getTimeline($universe, $limit);
        $byType = [];
        foreach ($timeline as $entry) {
            $type = $entry['type'] ?? 'other';
            if (!isset($byType[$type])) {
                $byType[$type] = [];
            }
            $byType[$type][] = $entry;
        }
        return $byType;
    }
}
