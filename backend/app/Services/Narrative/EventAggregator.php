<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use Illuminate\Support\Collection;

/**
 * Groups raw event chronicles by universe + tick (and optionally tick window) so that
 * one LLM call can generate one narrative for many events (e.g. "23 deaths, 1 war, 4 anomalies").
 */
class EventAggregator
{
    /**
     * Group chronicles by (universe_id, tick). Within each group, sub-group by action and build payload with _count and _samples.
     *
     * @param  Collection<int, Chronicle>  $chronicles
     * @return array<int, array{universe_id: int, tick: int, chronicles: array<int, Chronicle>, batches: array<int, array{action: string, payload: array}>}>
     */
    public function aggregateByUniverseAndTick(Collection $chronicles, int $tickWindowSize = 1): array
    {
        $byKey = [];
        foreach ($chronicles as $c) {
            if (!$c->raw_payload || $c->content) {
                continue;
            }
            $payload = is_array($c->raw_payload) ? $c->raw_payload : json_decode($c->raw_payload, true);
            if (!is_array($payload)) {
                continue;
            }
            $tick = (int) ($c->from_tick ?? $c->to_tick ?? 0);
            $tickBucket = $tickWindowSize > 1 ? (int) (floor($tick / $tickWindowSize) * $tickWindowSize) : $tick;
            $key = $c->universe_id . ':' . $tickBucket;

            if (!isset($byKey[$key])) {
                $byKey[$key] = [
                    'universe_id' => $c->universe_id,
                    'tick' => $tickBucket,
                    'chronicles' => [],
                    'by_action' => [],
                ];
            }
            $byKey[$key]['chronicles'][] = $c;
            $action = $payload['action'] ?? 'legacy_event';
            if (!isset($byKey[$key]['by_action'][$action])) {
                $byKey[$key]['by_action'][$action] = ['payloads' => [], 'chronicles' => []];
            }
            $byKey[$key]['by_action'][$action]['payloads'][] = $payload;
            $byKey[$key]['by_action'][$action]['chronicles'][] = $c;
        }

        $result = [];
        foreach ($byKey as $group) {
            $batches = [];
            foreach ($group['by_action'] as $action => $data) {
                $payloads = $data['payloads'];
                $count = count($payloads);
                $samples = array_slice($payloads, 0, 5);
                $merged = $samples[0] ?? [];
                $merged['_count'] = $count;
                $merged['_samples'] = $samples;
                $batches[] = [
                    'action' => $action,
                    'payload' => $merged,
                    'chronicles' => $data['chronicles'],
                ];
            }
            $result[] = [
                'universe_id' => $group['universe_id'],
                'tick' => $group['tick'],
                'chronicles' => $group['chronicles'],
                'batches' => $batches,
            ];
        }
        return array_values($result);
    }
}
