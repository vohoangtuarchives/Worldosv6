<?php

namespace App\Services\Simulation;

use App\Contracts\CausalityGraphServiceInterface;

/**
 * No-op implementation. Use RedisCausalityGraphService for actual causality chain storage.
 */
final class NullCausalityGraphService implements CausalityGraphServiceInterface
{
    public function recordEvent(int $universeId, string $eventId, string $type, int $tick): void
    {
    }
}
