<?php

namespace App\Simulation\StateCache;

use App\Simulation\Contracts\StateCacheInterface;

final class NullStateCache implements StateCacheInterface
{
    public function get(int $universeId): ?array
    {
        return null;
    }

    public function set(int $universeId, array $stateVector, int $tick): void
    {
        // no-op
    }
}
