<?php

namespace App\Simulation;

use App\Simulation\Contracts\WorldEventBusInterface;
use App\Simulation\Events\WorldEvent;

/** No-op event bus for tests. */
final class NullWorldEventBus implements WorldEventBusInterface
{
    public function publish(WorldEvent $event): void
    {
    }
}
