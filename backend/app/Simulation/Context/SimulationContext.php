<?php
namespace App\Simulation\Context;

class SimulationContext {
    public function __construct(public readonly int $tick = 1) {}
    public function getTick(): int { return $this->tick; }
}
