<?php

namespace App\Simulation\Runtime\Contracts;

/**
 * Interface for all simulation output events.
 */
interface SimulationEvent
{
    public function type(): string;
    public function payload(): array;
}
