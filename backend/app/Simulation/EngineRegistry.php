<?php

namespace App\Simulation;

use App\Simulation\Contracts\SimulationEngine;

/**
 * Registry of simulation engines, sorted by priority for Tick Pipeline (doc §3).
 */
final class EngineRegistry
{
    /** @var SimulationEngine[] */
    private array $engines = [];

    public function register(SimulationEngine $engine): void
    {
        $this->engines[] = $engine;
    }

    /**
     * Return engines sorted by priority (ascending: 1 runs first).
     *
     * @return SimulationEngine[]
     */
    public function getOrdered(): array
    {
        $ordered = $this->engines;
        usort($ordered, static fn (SimulationEngine $a, SimulationEngine $b) => $a->priority() <=> $b->priority());
        return $ordered;
    }
}
