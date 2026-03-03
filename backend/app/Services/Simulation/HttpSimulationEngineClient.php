<?php

namespace App\Services\Simulation;

use App\Contracts\SimulationEngineClientInterface;
use Illuminate\Support\Facades\Http;

/**
 * HTTP bridge to WorldOS simulation engine (Rust).
 * Engine must expose POST /advance with JSON body and response.
 * Set SIMULATION_ENGINE_GRPC_URL to http://localhost:50052 (or http://host:port).
 */
class HttpSimulationEngineClient implements SimulationEngineClientInterface
{
    public function __construct(
        protected string $baseUrl
    ) {}

    public function advance(int $universeId, int $ticks, string $stateInput = '', ?array $worldConfig = null): array
    {
        $url = rtrim($this->baseUrl, '/').'/advance';
        $payload = [
            'universe_id' => $universeId,
            'ticks' => $ticks,
            'state_input' => $stateInput,
            'world_config' => $worldConfig,
        ];

        try {
            $response = Http::timeout(60)->post($url, $payload);
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'snapshot' => null,
                'error_message' => $e->getMessage(),
            ];
        }

        if (! $response->successful()) {
            return [
                'ok' => false,
                'snapshot' => null,
                'error_message' => $response->body() ?: 'HTTP '.$response->status(),
            ];
        }

        $data = $response->json();
        $ok = $data['ok'] ?? false;
        $errorMessage = $data['error_message'] ?? '';
        $snapshotData = $data['snapshot'] ?? null;

        $snapshot = null;
        if ($snapshotData && is_array($snapshotData)) {
            $snapshot = [
                'universe_id' => $snapshotData['universe_id'] ?? $universeId,
                'tick' => $snapshotData['tick'] ?? $ticks,
                'state_vector' => $snapshotData['state_vector'] ?? '{}',
                'entropy' => $snapshotData['entropy'] ?? null,
                'stability_index' => $snapshotData['stability_index'] ?? null,
                'metrics' => $snapshotData['metrics'] ?? '{}',
            ];
        }

        return [
            'ok' => $ok,
            'snapshot' => $snapshot,
            'error_message' => $errorMessage,
        ];
    }
}
