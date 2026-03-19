<?php

namespace App\Modules\Simulation\Services\RuleEngine;

use App\Contracts\SimulationEngineClientInterface;
use Illuminate\Support\Facades\Log;

/**
 * @deprecated Use SimulationEngineClientInterface instead.
 * This class now acts as a wrapper around the bound SimulationEngineClient.
 */
class FfiRuleEngine
{
    private SimulationEngineClientInterface $client;

    public function __construct(SimulationEngineClientInterface $client = null)
    {
        $this->client = $client ?: app(SimulationEngineClientInterface::class);
    }

    /**
     * Evaluate a DSL script against a JSON encoded WorldState using the bound SimulationEngineClient.
     */
    public function evaluateDsl(string $dslScript, string $stateJson, int $seed): ?array
    {
        $state = json_decode($stateJson, true) ?: [];
        $state['seed'] = $seed;

        $result = $this->client->evaluateRules($state, $dslScript);

        if (!$result['ok']) {
            Log::error("FfiRuleEngine wrapper error: " . ($result['error_message'] ?? 'Unknown error'));
            return null;
        }

        return $result['outputs'];
    }

    /**
     * Phase 15: Grid-Based Metabolic Calculation using bound SimulationEngineClient.
     */
    public function computeMetabolismGrid(array &$populations, array &$biomasses, array $industries, float $efficiency, float $baseEnergy): array
    {
        $result = $this->client->computeMetabolismGrid($populations, $biomasses, $industries, $efficiency, $baseEnergy);
        
        // Update input arrays (simulating FFI pointer behavior)
        if (isset($result['populations'])) $populations = $result['populations'];
        if (isset($result['biomasses'])) $biomasses = $result['biomasses'];

        return [
            'total_waste' => $result['total_waste'] ?? 0.0,
            'net_energies' => $result['net_energies'] ?? []
        ];
    }
}
