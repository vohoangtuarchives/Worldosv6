<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Geological Engine (Tier 5).
 * Elevation, terrain type, mineral distribution per zone. Very slow (geology_tick 5000+).
 * Provides terrain for Climate (elevation) and Civilization. Deterministic: seed + tick.
 */
class GeologicalEngine
{
    private const TERRAIN_LOWLAND = 'lowland';
    private const TERRAIN_HIGHLAND = 'highland';
    private const TERRAIN_VOLCANIC = 'volcanic';

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    /**
     * Update elevation, terrain, minerals per zone. Call after climate.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.geological.tick_interval', 5000);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $zones = &$stateVector['zones'];
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $seed = (int) ($universe->seed ?? 0) + (int) $universe->id * 31;
        $driftRate = (float) config('worldos.geological.elevation_drift_rate', 0.002);
        $volcanoProb = (float) config('worldos.geological.volcano_probability_per_zone', 0.02);
        $erosionRate = (float) config('worldos.geological.erosion_rate', 0.001);

        $zonesModified = false;
        $zoneCount = count($zones);
        foreach ($zones as $zoneIndex => &$zone) {
            $state = &$zone['state'];
            if (!is_array($state)) {
                $state = [];
            }

            $elevation = $this->getOrInitElevation($state, $seed, $currentTick, $zoneIndex, $zoneCount);
            $rng = $this->deterministicFloat($seed, $currentTick, $zoneIndex, 0);

            $uplift = ($rng - 0.5) * 2 * $driftRate;
            $elevation += $uplift;
            $elevation -= $erosionRate;
            $elevation = max(0.0, min(1.0, (float) $elevation));

            $volcanoActive = $this->deterministicFloat($seed, $currentTick, $zoneIndex, 1) < $volcanoProb;
            if ($volcanoActive) {
                $elevation = min(1.0, $elevation + 0.05);
            }

            $terrainType = $this->elevationToTerrain($elevation, $volcanoActive);
            $mineralRichness = $this->deterministicFloat($seed, $currentTick, $zoneIndex, 2);

            $state['elevation'] = round($elevation, 4);
            $state['terrain_type'] = $terrainType;
            $state['mineral_richness'] = round($mineralRichness, 4);
            $state['volcano_active'] = $volcanoActive;
            $state['geology_tick'] = $currentTick;
            $zonesModified = true;
        }
        unset($zone, $state);

        if ($zonesModified) {
            $stateVector['zones'] = $zones;
            $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
            Log::debug("GeologicalEngine: Universe {$universe->id} geology updated at tick {$currentTick}", [
                'zones' => $zoneCount,
            ]);
        }
    }

    private function getOrInitElevation(array $state, int $seed, int $tick, int $zoneIndex, int $zoneCount): float
    {
        if (array_key_exists('elevation', $state) && is_numeric($state['elevation'])) {
            return max(0.0, min(1.0, (float) $state['elevation']));
        }
        $phase = (($tick * 0.0001 + $zoneIndex * 0.17 + $seed * 0.00001) % 1.0 + 1.0) % 1.0;
        return max(0.0, min(1.0, 0.3 + 0.4 * sin($phase * 2 * M_PI)));
    }

    private function elevationToTerrain(float $elevation, bool $volcanoActive): string
    {
        if ($volcanoActive || $elevation >= 0.75) {
            return self::TERRAIN_VOLCANIC;
        }
        if ($elevation < 0.35) {
            return self::TERRAIN_LOWLAND;
        }
        return self::TERRAIN_HIGHLAND;
    }

    private function deterministicFloat(int $seed, int $tick, int $zoneIndex, int $salt): float
    {
        $h = crc32($seed . ':' . $tick . ':' . $zoneIndex . ':' . $salt);
        return (float) (($h & 0x7FFFFFFF) / 0x7FFFFFFF);
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
