<?php

namespace App\Services\Simulation;

use App\Contracts\SimulationEngineClientInterface;

/**
 * Phase 1 stub: returns empty snapshot without calling Rust engine.
 * Replace with gRPC client in Phase 3.
 */
class StubSimulationEngineClient implements SimulationEngineClientInterface
{
    public function advance(int $universeId, int $ticks, array $stateInput = [], ?array $worldConfig = null): array
    {
        // Simple mock of a simulation advance
        $tick = (int) (time() / 100);
        $state = $stateInput;
        $currentTick = $state['tick'] ?? 0;
        $entropy = $state['global_entropy'] ?? $state['entropy'] ?? 0.1;
        $stability = $state['stability_index'] ?? 1.0;
        
        return [
            'ok' => true,
            'snapshot' => [
                'universe_id' => $universeId,
                'tick' => $currentTick + $ticks,
                'state_vector' => $state,
                'entropy' => $entropy,
                'stability_index' => $stability,
                'metrics' => $state['metrics'] ?? [],
            ],
            'error_message' => '',
        ];
    }

    public function merge(string $stateA, string $stateB): array
    {
        return [
            'ok' => true,
            'snapshot' => [
                'universe_id' => 0,
                'tick' => 0,
                'state_vector' => '{}',
                'entropy' => 0.5,
                'stability_index' => 0.5,
                'metrics' => '{}',
            ],
            'error_message' => '',
        ];
    }

    public function batchAdvance(array $requests): array
    {
        $responses = [];
        foreach ($requests as $req) {
            $responses[] = $this->advance($req['universe_id'], $req['ticks'], $req['state_input'] ?? [], $req['world_config'] ?? null);
        }
        return ['responses' => $responses];
    }

    public function analyzeTrajectory(array $points, float $threshold = 0.1): array
    {
        return [
            'is_strange_attractor' => false,
            'is_bounded' => true,
            'recurrence_rate' => 0.05,
            'max_lyapunov_estimate' => -0.1,
            'trajectory_variance' => 0.1,
            'basin_center' => [],
            'basin_radius' => 0.0,
            'regime_transitions' => [],
        ];
    }

    public function evaluateRules(array $state, ?string $rulesDsl = null): array
    {
        return [
            'ok' => true,
            'outputs' => [],
            'error_message' => null,
        ];
    }
}
