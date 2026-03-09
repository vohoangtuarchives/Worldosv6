<?php

namespace App\Services\Simulation;

use App\Contracts\CausalityGraphServiceInterface;
use Illuminate\Support\Facades\Redis;

/**
 * doc §4: store causality chain per universe in Redis (event_id → cause_event_id).
 */
final class RedisCausalityGraphService implements CausalityGraphServiceInterface
{
    private const KEY_LAST = 'worldos:causality:last:%s';
    private const KEY_CHAIN = 'worldos:causality:chain:%s';
    private const CHAIN_TTL = 86400 * 30; // 30 days

    public function recordEvent(int $universeId, string $eventId, string $type, int $tick): void
    {
        $keyLast = sprintf(self::KEY_LAST, $universeId);
        $keyChain = sprintf(self::KEY_CHAIN, $universeId);
        $causeEventId = Redis::get($keyLast);
        $link = json_encode([
            'event_id' => $eventId,
            'type' => $type,
            'tick' => $tick,
            'cause_event_id' => $causeEventId ?: null,
        ]);
        Redis::rPush($keyChain, $link);
        Redis::expire($keyChain, self::CHAIN_TTL);
        Redis::setex($keyLast, self::CHAIN_TTL, $eventId);
    }
}
