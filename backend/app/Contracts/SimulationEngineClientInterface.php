<?php

namespace App\Contracts;

/**
 * Interface for calling the WorldOS simulation engine (Rust gRPC).
 * Phase 1: stub. Phase 3: implement with real gRPC client.
 */
interface SimulationEngineClientInterface
{
    /**
     * Advance universe by N ticks, return snapshot.
     *
     * @param  int  $universeId
     * @param  int  $ticks
     * @param  array  $stateInput  Optional state vector array.
     * @param  array|null  $worldConfig Optional world metadata (origin, axioms, etc.)
     * @return array{ok: bool, snapshot?: array, error_message?: string}
     */
    public function advance(int $universeId, int $ticks, array $stateInput = [], ?array $worldConfig = null): array;

    /**
     * Merge two universes into one.
     */
    public function merge(string $stateA, string $stateB): array;

    /**
     * Run N simulations in a single call.
     *
     * @param  array  $requests  Array of advance requests.
     * @return array{responses: array}
     */
    public function batchAdvance(array $requests): array;

    /**
     * Analyze a trajectory (recurrence matrix, Lyapunov, etc.)
     *
     * @param  array  $points  Array of {tick, state} points.
     * @param  float  $threshold  Recurrence threshold (default 0.1).
     * @return array{is_strange_attractor: bool, is_bounded: bool, recurrence_rate: float, max_lyapunov_estimate: float, trajectory_variance: float, basin_center: array, basin_radius: float, regime_transitions: array}
     */
    public function analyzeTrajectory(array $points, float $threshold = 0.1): array;
}
