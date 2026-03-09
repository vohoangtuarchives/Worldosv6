<?php

namespace App\Simulation\Contracts;

use App\Simulation\Events\WorldEvent;

interface WorldEventBusInterface
{
    public function publish(WorldEvent $event): void;
}
