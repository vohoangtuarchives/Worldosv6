<?php

namespace App\Services\Narrative;

use Illuminate\Support\Facades\Cache;

/**
 * Cache narrative by prompt_hash or event_signature to reuse for similar events (e.g. 100 peasant deaths → 1 narrative).
 */
class NarrativeCache
{
    private const PREFIX = 'worldos_narrative:';
    private const TTL_SECONDS = 86400 * 30; // 30 days

    public function get(string $key): ?string
    {
        $fullKey = self::PREFIX . $key;
        $value = Cache::get($fullKey);
        return $value === null ? null : (string) $value;
    }

    public function put(string $key, string $content): void
    {
        Cache::put(self::PREFIX . $key, $content, self::TTL_SECONDS);
    }

    public function keyForPayload(string $action, array $payload): string
    {
        $normalized = [
            'action' => $action,
            'count' => $payload['_count'] ?? 1,
            'summary' => $this->summarizeForHash($payload),
        ];
        return hash('sha256', json_encode($normalized));
    }

    /**
     * Normalize payload for hashing (avoid storing huge payloads).
     */
    private function summarizeForHash(array $payload): array
    {
        $out = [];
        foreach (['agent_name', 'archetype', 'paradox_type', 'anomaly_type', 'cheat_granted', 'description'] as $k) {
            if (isset($payload[$k])) {
                $out[$k] = $payload[$k];
            }
        }
        if (isset($payload['_samples']) && is_array($payload['_samples'])) {
            $out['sample_count'] = count($payload['_samples']);
        }
        return $out;
    }
}
