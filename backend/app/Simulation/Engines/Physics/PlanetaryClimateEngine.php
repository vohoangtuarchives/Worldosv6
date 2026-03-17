<?php

namespace App\Simulation\Engines\Physics;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Planetary Climate Engine (Tier 4).
 * Solar input, latitude climate zones, simple temperature/rainfall per zone,
 * seasonal cycle, optional ice coverage (albedo feedback). Output feeds Phase Transition and biome.
 * Runs slowly (climate_tick_interval e.g. 500+). Deterministic: seed + tick.
 */
class PlanetaryClimateEngine
{
    public function __construct() {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.planetary_climate.tick_interval', 500);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $zones = $state->get('zones');
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $universeId = (int) $state->get('universe_id', 0);
        $seed = (int) ($state->get('seed', 0)) + $universeId * 31;
        $seasonalTicks = max(1, (int) config('worldos.planetary_climate.seasonal_cycle_ticks', 1000));
        $baseTemp = (float) config('worldos.planetary_climate.base_temperature', 0.5);
        $latTempAmp = (float) config('worldos.planetary_climate.latitude_temperature_amplitude', 0.25);
        $seasonTempAmp = (float) config('worldos.planetary_climate.seasonal_temperature_amplitude', 0.1);
        $equatorRain = (float) config('worldos.planetary_climate.equator_rainfall', 0.75);
        $poleRain = (float) config('worldos.planetary_climate.pole_rainfall', 0.2);
        $iceTempThreshold = (float) config('worldos.planetary_climate.ice_coverage_temp_threshold', 0.25);

        $zoneCount = count($zones);
        $seasonPhase = ($currentTick / $seasonalTicks + $seed * 0.00001) % 1.0;
        $seasonalFactor = sin($seasonPhase * 2 * M_PI);

        $zonesModified = false;
        foreach ($zones as $zoneIndex => &$zone) {
            $zoneState = &$zone['state'];
            if (!is_array($zoneState)) {
                $zoneState = [];
            }

            $latitude = $zoneCount > 1
                ? (float) $zoneIndex / (float) ($zoneCount - 1)
                : 0.5;
            $latNorm = 2 * abs($latitude - 0.5);

            $temperature = $baseTemp
                - $latTempAmp * $latNorm
                + $seasonTempAmp * $seasonalFactor;
            if (isset($zoneState['elevation']) && is_numeric($zoneState['elevation'])) {
                $temperature -= (float) $zoneState['elevation'] * 0.15;
            }
            $temperature = max(0.0, min(1.0, $temperature));

            $rainfall = $equatorRain - ($equatorRain - $poleRain) * $latNorm;
            $rainfall = $rainfall + 0.05 * $seasonalFactor;
            $rainfall = max(0.0, min(1.0, $rainfall));

            $iceCoverage = $temperature <= $iceTempThreshold
                ? (1.0 - $temperature / max(0.01, $iceTempThreshold)) * 0.8
                : 0.0;
            $iceCoverage = max(0.0, min(1.0, (float) $iceCoverage));

            $zoneState['temperature'] = round($temperature, 4);
            $zoneState['rainfall'] = round($rainfall, 4);
            $zoneState['ice_coverage'] = round($iceCoverage, 4);
            $zoneState['season_phase'] = round($seasonPhase, 4);
            $zoneState['climate_tick'] = $currentTick;
            $zonesModified = true;
        }
        unset($zone, $zoneState);

        if ($zonesModified) {
            $state->set('zones', $zones);
            Log::debug("PlanetaryClimateEngine: Universe {$universeId} climate updated at tick {$currentTick}");
        }
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // Deprecated
    }
}
