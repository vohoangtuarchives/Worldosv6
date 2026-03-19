<?php

namespace App\Modules\Simulation\Services;

use App\Contracts\SimulationEngineClientInterface;
use Illuminate\Support\Facades\Log;

/**
 * @deprecated Use SimulationEngineClientInterface instead.
 * This class now acts as a wrapper around the bound SimulationEngineClient.
 */
class FfiActorEngine
{
    protected SimulationEngineClientInterface $client;

    public function __construct(SimulationEngineClientInterface $client = null)
    {
        $this->client = $client ?: app(SimulationEngineClientInterface::class);
    }

    public function processActorsSoa(
        int $tick,
        array $ids,
        array $zoneIds,
        array $hunger,
        array $energy,
        array $fear,
        array $trauma,
        array $heroicTypes,
        array $lineageIds,
        array $memes
    ): array {
        return $this->client->processActorsSoa($tick, $ids, $zoneIds, $hunger, $energy, $fear, $trauma, $heroicTypes, $lineageIds, $memes);
    }

    public function processFieldsV7(
        array $fields, array $neighborCounts, array $neighborOffsets,
        array $neighbors, float $diffusionRate, float $preservationRate
    ): array {
        return $this->client->processFieldsV7($fields, $neighborCounts, $neighborOffsets, $neighbors, $diffusionRate, $preservationRate);
    }

    public function tickUniverseEmergent(array $state, array $influences, int $seed): array
    {
        // tickUniverseEmergent mapping to advance()
        $result = $this->client->advance(0, 1, $state, ['influences' => $influences, 'seed' => $seed]);
        return $result['snapshot'] ?? ['state' => $state, 'scars' => [], 'narrative_tags' => []];
    }

    public function calculateVocationAlignment(array $actorMotivation, array $targetProfile): float
    {
        return $this->client->calculateVocationAlignment($actorMotivation, $targetProfile);
    }

    public function getCombinedGravity(array $rulesets): float
    {
        return $this->client->getCombinedGravity($rulesets);
    }
}
