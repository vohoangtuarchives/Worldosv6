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

    public function advance(int $universeId, int $ticks, array $stateInput = [], ?array $worldConfig = null): array
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
                'sci' => $snapshotData['sci'] ?? null,
                'instability_gradient' => $snapshotData['instability_gradient'] ?? null,
            ];
        }

        return [
            'ok' => $ok,
            'snapshot' => $snapshot,
            'error_message' => $errorMessage,
        ];
    }

    public function merge(string $stateA, string $stateB): array
    {
        $url = rtrim($this->baseUrl, '/').'/merge';
        $payload = [
            'state_a' => $stateA,
            'state_b' => $stateB,
        ];

        try {
            $response = Http::timeout(60)->post($url, $payload);
        } catch (\Throwable $e) {
            return ['ok' => false, 'snapshot' => null, 'error_message' => $e->getMessage()];
        }

        if (!$response->successful()) {
            return ['ok' => false, 'snapshot' => null, 'error_message' => $response->body() ?: 'HTTP '.$response->status()];
        }

        $data = $response->json();
        $snapshotData = $data['snapshot'] ?? null;
        $snapshot = null;

        if ($snapshotData && is_array($snapshotData)) {
            $snapshot = [
                'universe_id' => 0,
                'tick' => $snapshotData['tick'] ?? 0,
                'state_vector' => $snapshotData['state_vector'] ?? '{}',
                'entropy' => $snapshotData['entropy'] ?? null,
                'stability_index' => $snapshotData['stability_index'] ?? null,
                'metrics' => $snapshotData['metrics'] ?? '{}',
                'sci' => $snapshotData['sci'] ?? null,
                'instability_gradient' => $snapshotData['instability_gradient'] ?? null,
            ];
        }

        return [
            'ok' => $data['ok'] ?? false,
            'snapshot' => $snapshot,
            'error_message' => $data['error_message'] ?? '',
        ];
    }

    public function batchAdvance(array $requests): array
    {
        $url = rtrim($this->baseUrl, '/').'/batch-advance';
        $payload = ['requests' => $requests];

        try {
            $response = Http::timeout(120)->post($url, $payload);
        } catch (\Throwable $e) {
            return ['responses' => [], 'error_message' => $e->getMessage()];
        }

        if (!$response->successful()) {
            return ['responses' => [], 'error_message' => $response->body() ?: 'HTTP '.$response->status()];
        }

        $data = $response->json();
        $responses = [];

        foreach (($data['responses'] ?? []) as $res) {
            $snapshotData = $res['snapshot'] ?? null;
            $snapshot = null;
            if ($snapshotData && is_array($snapshotData)) {
                $snapshot = [
                    'universe_id' => $snapshotData['universe_id'] ?? 0,
                    'tick' => $snapshotData['tick'] ?? 0,
                    'state_vector' => $snapshotData['state_vector'] ?? '{}',
                    'entropy' => $snapshotData['entropy'] ?? null,
                    'stability_index' => $snapshotData['stability_index'] ?? null,
                    'metrics' => $snapshotData['metrics'] ?? '{}',
                    'sci' => $snapshotData['sci'] ?? null,
                    'instability_gradient' => $snapshotData['instability_gradient'] ?? null,
                ];
            }
            $responses[] = [
                'ok' => $res['ok'] ?? false,
                'snapshot' => $snapshot,
                'error_message' => $res['error_message'] ?? '',
            ];
        }

        return ['responses' => $responses];
    }

    public function analyzeTrajectory(array $points, float $threshold = 0.1): array
    {
        $url = rtrim($this->baseUrl, '/').'/analyze-trajectory';
        $payload = [
            'points' => $points,
            'recurrence_threshold' => $threshold,
        ];

        try {
            $response = Http::timeout(60)->post($url, $payload);
        } catch (\Throwable $e) {
            return ['ok' => false, 'error_message' => $e->getMessage()];
        }

        if (!$response->successful()) {
            return ['ok' => false, 'error_message' => $response->body() ?: 'HTTP '.$response->status()];
        }

        return $response->json();
    }
}
