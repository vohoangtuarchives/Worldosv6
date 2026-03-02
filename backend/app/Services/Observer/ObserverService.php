<?php

namespace App\Services\Observer;

use Illuminate\Support\Facades\Redis;

/**
 * Observer: publish universe events to Redis Stream for realtime dashboard / WebSocket.
 * Stream key: universe:events:{multiverse_id} or universe:events (global).
 */
class ObserverService
{
    protected string $streamPrefix = 'universe:events';

    public function publishSnapshot(int $universeId, ?int $multiverseId, int $tick, array $payload): void
    {
        $key = $multiverseId !== null
            ? "{$this->streamPrefix}:{$multiverseId}"
            : $this->streamPrefix;
        $payload['universe_id'] = $universeId;
        $payload['tick'] = $tick;
        $payload['event'] = 'snapshot';
        $payload['at'] = now()->toIso8601String();
        $this->addToStream($key, $payload);
    }

    public function publishEvent(int $universeId, ?int $multiverseId, string $eventType, array $payload): void
    {
        $key = $multiverseId !== null
            ? "{$this->streamPrefix}:{$multiverseId}"
            : $this->streamPrefix;
        $payload['universe_id'] = $universeId;
        $payload['event'] = $eventType;
        $payload['at'] = now()->toIso8601String();
        $this->addToStream($key, $payload);
    }

    protected function addToStream(string $key, array $payload): void
    {
        try {
            $flat = [];
            foreach ($payload as $k => $v) {
                $flat[$k] = is_scalar($v) ? (string) $v : json_encode($v);
            }
            Redis::xAdd($key, '*', $flat, 10000);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
