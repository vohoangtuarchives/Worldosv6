<?php

namespace App\Simulation\Engines\Physics;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\PressureUpdateEffect;
use App\Simulation\Effects\AxiomUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Services\CosmicSignalCollector;
use App\Simulation\Services\PhasePressureCalculator;
use App\Simulation\Support\SimulationRandom;
use App\Services\Simulation\RuleVmService;
use function resource_path;
use function file_get_contents;
use function max;
use function min;
use function config;

/**
 * Cosmic Pressure Engine: accumulates pressures from metrics each tick, applies decay,
 * computes phase pressures (ascension_pressure, collapse_pressure) from cosmic signals,
 * and emits PressureUpdateEffect. AscensionEngine uses these for transition thresholds.
 */
final class CosmicPressureEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'meta';
    }

    private const DECAY = 0.98;
    private const INNOVATION_WEIGHT = 0.01;
    private const ENTROPY_WEIGHT = 0.015;
    private const ORDER_WEIGHT = 0.01;
    private const MYTH_WEIGHT = 0.01;
    private const CONFLICT_WEIGHT = 0.02;
    private const ASCENSION_WEIGHT = 0.012;

    public function __construct(
        private RuleVmService $ruleVm,
    ) {
    }

    public function name(): string
    {
        return 'cosmic_pressure';
    }

    public function priority(): int
    {
        return 3;
    }

    public function tickRate(): int
    {
        return max(1, (int) (\config('worldos.time_scale_factors.cosmic_pressure') ?? 1));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        
        // 1. Axiomatic Drifts & Consciousness Warping (Phase 31)
        // These rules evolve the universal constants (axioms) and meta-metrics
        $this->evaluateDslFile($state, 'simulation/consciousness.dsl', $tick);
        $this->evaluateDslFile($state, 'physics/axioms.dsl', $tick);

        // 2. Core Physics: Accumulate pressures, handle transitions, and safety clamps
        $this->evaluateDslFile($state, 'physics/core.dsl', $tick);

        return EngineResult::empty();
    }

    /**
     * Helper to evaluate a specific DSL file using the RuleVmService.
     */
    protected function evaluateDslFile(WorldState $state, string $relativePath, int $tick): void
    {
        $path = \resource_path('worldos_rules/' . $relativePath);
        if (!file_exists($path)) {
            return;
        }

        $dsl = file_get_contents($path);
        
        // We evaluate and apply directly to the shared WorldState.
        // This leverages the Phase 32 upgrades in RuleVmService.
        $this->ruleVm->evaluateAndApply($this->stateToUniverseStub($state), $this->stateToSnapshotStub($state, $tick), $dsl);
    }

    /**
     * Compatibility bridge: Build a temporary Universe stub from WorldState.
     */
    protected function stateToUniverseStub(WorldState $state): \App\Models\Universe
    {
        $universe = new \App\Models\Universe();
        $universe->id = (int) $state->get('universe_id', 0);
        $universe->state_vector = $state->toArray();
        return $universe;
    }

    /**
     * Compatibility bridge: Build a temporary Snapshot stub from WorldState.
     */
    protected function stateToSnapshotStub(WorldState $state, int $tick): \App\Models\UniverseSnapshot
    {
        $snapshot = new \App\Models\UniverseSnapshot();
        $snapshot->tick = $tick;
        $snapshot->state_vector = $state->toArray();
        return $snapshot;
    }
}
