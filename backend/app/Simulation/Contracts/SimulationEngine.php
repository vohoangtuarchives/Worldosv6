<?php

namespace App\Simulation\Contracts;

use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;

interface SimulationEngine
{
    /** Human-readable engine name (e.g. for logging). */
    public function name(): string;

    /**
     * Priority in tick pipeline (1 = first). Doc §3: Planet=1, Climate=2, Ecology=3, Civilization=4, …
     */
    public function priority(): int;

    /**
     * Phase group for scaling (Doc 21 §6). E.g. PHYSICAL, CLIMATE, ECOLOGY, ECONOMY, SOCIAL, POLITICS, CONFLICT, CULTURE, META. Use 'default' if not using groups.
     */
    public function phase(): string;

    /**
     * Run this engine every N ticks. 1 = every tick, 10 = every 10th tick. Doc 21 §9: same as "interval" (ticks between runs).
     */
    public function tickRate(): int;

    /**
     * Evaluate current state and return result (events, state changes, metrics). Must not mutate DB or snapshot.
     */
    public function handle(WorldState $state, TickContext $ctx): EngineResult;
}
