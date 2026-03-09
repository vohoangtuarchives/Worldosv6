<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\PressureUpdateEffect;
use App\Simulation\Services\CosmicSignalCollector;
use App\Simulation\Services\PhasePressureCalculator;
use App\Simulation\Support\SimulationRandom;

/**
 * Cosmic Pressure Engine: accumulates pressures from metrics each tick, applies decay,
 * computes phase pressures (ascension_pressure, collapse_pressure) from cosmic signals,
 * and emits PressureUpdateEffect. AscensionEngine uses these for transition thresholds.
 */
final class CosmicPressureEngine implements SimulationEngine
{
    private const DECAY = 0.98;
    private const INNOVATION_WEIGHT = 0.01;
    private const ENTROPY_WEIGHT = 0.015;
    private const ORDER_WEIGHT = 0.01;
    private const MYTH_WEIGHT = 0.01;
    private const CONFLICT_WEIGHT = 0.02;
    private const ASCENSION_WEIGHT = 0.012;

    public function __construct(
        private readonly CosmicSignalCollector $signalCollector,
        private readonly PhasePressureCalculator $phasePressureCalculator,
    ) {
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.cosmic_pressure') ?? 1));
    }

    public function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $pressures = $state->getPressures();

        $innovation = $state->getInnovation();
        $entropy = $state->getEntropy();
        $order = (float) $state->getStateVectorKey('order', 0);
        $myth = (float) $state->getStateVectorKey('myth', 0);
        $violence = (float) $state->getStateVectorKey('violence', 0);
        $spirituality = (float) $state->getStateVectorKey('spirituality', 0);

        $pressures['innovation'] = min(1.0, ($pressures['innovation'] * self::DECAY) + ($innovation * self::INNOVATION_WEIGHT));
        $pressures['entropy'] = min(1.0, ($pressures['entropy'] * self::DECAY) + ($entropy * self::ENTROPY_WEIGHT));
        $pressures['order'] = min(1.0, ($pressures['order'] * self::DECAY) + ($order * self::ORDER_WEIGHT));
        $pressures['myth'] = min(1.0, ($pressures['myth'] * self::DECAY) + ($myth * self::MYTH_WEIGHT));
        $pressures['conflict'] = min(1.0, ($pressures['conflict'] * self::DECAY) + ($violence * self::CONFLICT_WEIGHT));
        $pressures['ascension'] = min(1.0, ($pressures['ascension'] * self::DECAY) + ($spirituality * self::ASCENSION_WEIGHT));

        // Phase Pressure Model: ascension_pressure, collapse_pressure from cosmic signals
        $signals = $this->signalCollector->collect($state);
        $phase = $this->phasePressureCalculator->calculate($signals);
        $pressures['ascension_pressure'] = $phase['ascension_pressure'];
        $pressures['collapse_pressure'] = $phase['collapse_pressure'];

        return [new PressureUpdateEffect($pressures)];
    }
}
