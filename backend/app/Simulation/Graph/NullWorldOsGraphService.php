<?php

namespace App\Simulation\Graph;

use App\Simulation\Contracts\WorldOsGraphServiceInterface;

/** No-op implementation when graph sync is disabled. */
final class NullWorldOsGraphService implements WorldOsGraphServiceInterface
{
    public function syncEvent(array $eventData): void
    {
    }
}
