<?php

namespace App\Services\Simulation;

use App\Contracts\SimulationEngineClientInterface;

/**
 * Phase 1 stub: returns empty snapshot without calling Rust engine.
 * Replace with gRPC client in Phase 3.
 */
class StubSimulationEngineClient implements SimulationEngineClientInterface
{
    public function advance(int $universeId, int $ticks, string $stateInput = '', ?array $worldConfig = null): array
    {
        // Simple mock of a simulation advance
        $tick = (int) (time() / 100);
        $state = json_decode($stateInput, true) ?? [];
        $currentTick = $state['tick'] ?? 0;
        $entropy = $state['entropy'] ?? 0.1;
        $stability = $state['stability_index'] ?? 1.0;
        
        return [
            'ok' => true,
            'snapshot' => [
                'universe_id' => $universeId,
                'tick' => $currentTick + $ticks,
                'state_vector' => json_encode($state),
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
}
