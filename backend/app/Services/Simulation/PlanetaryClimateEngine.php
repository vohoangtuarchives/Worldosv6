<?php

namespace App\Services\Simulation;

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
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    /**
     * Update temperature and rainfall per zone. Call after sync, before Phase Transition.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.planetary_climate.tick_interval', 500);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $zones = &$stateVector['zones'];
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $seed = (int) ($universe->seed ?? 0) + (int) $universe->id * 31;
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
            $state = &$zone['state'];
            if (!is_array($state)) {
                $state = [];
            }

            $latitude = $zoneCount > 1
                ? (float) $zoneIndex / (float) ($zoneCount - 1)
                : 0.5;
            $latNorm = 2 * abs($latitude - 0.5);

            $temperature = $baseTemp
                - $latTempAmp * $latNorm
                + $seasonTempAmp * $seasonalFactor;
            if (isset($state['elevation']) && is_numeric($state['elevation'])) {
                $temperature -= (float) $state['elevation'] * 0.15;
            }
            $temperature = max(0.0, min(1.0, $temperature));

            $rainfall = $equatorRain - ($equatorRain - $poleRain) * $latNorm;
            $rainfall = $rainfall + 0.05 * $seasonalFactor;
            $rainfall = max(0.0, min(1.0, $rainfall));

            $iceCoverage = $temperature <= $iceTempThreshold
                ? (1.0 - $temperature / max(0.01, $iceTempThreshold)) * 0.8
                : 0.0;
            $iceCoverage = max(0.0, min(1.0, (float) $iceCoverage));

            $state['temperature'] = round($temperature, 4);
            $state['rainfall'] = round($rainfall, 4);
            $state['ice_coverage'] = round($iceCoverage, 4);
            $state['season_phase'] = round($seasonPhase, 4);
            $state['climate_tick'] = $currentTick;
            $zonesModified = true;
        }
        unset($zone, $state);

        if ($zonesModified) {
            $stateVector['zones'] = $zones;
            $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
            Log::debug("PlanetaryClimateEngine: Universe {$universe->id} climate updated at tick {$currentTick}", [
                'zones' => $zoneCount,
                'season_phase' => $seasonPhase,
            ]);
        }
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
