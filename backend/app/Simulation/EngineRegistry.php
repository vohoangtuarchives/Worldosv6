<?php

namespace App\Simulation;

use App\Simulation\Contracts\SimulationEngine;

/**
 * Registry of simulation engines, sorted by phase then priority for Tick Pipeline (doc §3, Doc 21 §6).
 */
final class EngineRegistry
{
    /** Phase sort order (lower index = run first). Doc 21 §6. */
    private const PHASE_ORDER = [
        'physical' => 0,
        'climate' => 1,
        'ecology' => 2,
        'economy' => 3,
        'social' => 4,
        'politics' => 5,
        'conflict' => 6,
        'culture' => 7,
        'meta' => 8,
        'default' => 9,
    ];

    /** @var SimulationEngine[] */
    private array $engines = [];

    public function register(SimulationEngine $engine): void
    {
        $this->engines[] = $engine;
    }

    /**
     * Return engines sorted by phase then priority (ascending: lower runs first).
     *
     * @return SimulationEngine[]
     */
    public function getOrdered(): array
    {
        $ordered = $this->engines;
        usort($ordered, static function (SimulationEngine $a, SimulationEngine $b): int {
            $phaseA = strtolower($a->phase());
            $phaseB = strtolower($b->phase());
            $orderA = self::PHASE_ORDER[$phaseA] ?? 9;
            $orderB = self::PHASE_ORDER[$phaseB] ?? 9;
            if ($orderA !== $orderB) {
                return $orderA <=> $orderB;
            }
            return $a->priority() <=> $b->priority();
        });
        return $ordered;
    }
}
