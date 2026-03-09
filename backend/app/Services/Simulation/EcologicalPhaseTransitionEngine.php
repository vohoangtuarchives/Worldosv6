<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Chronicle;
use App\Models\Universe;
use App\Simulation\SimulationEventBus;
use Illuminate\Support\Facades\Log;

/**
 * Ecological Phase Transition Engine (Tier 2).
 * EnvironmentState (temperature, rainfall) and EcosystemState (forest, grassland, desert).
 * When a threshold is crossed, transition gradually (progress 0→1); affects resource_regeneration per zone.
 * Writes PhaseTransitionEvent (Chronicle) on completion.
 */
class EcologicalPhaseTransitionEngine
{
    private const BIOMES = ['forest', 'grassland', 'desert'];

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected SimulationEventBus $eventBus
    ) {}

    /**
     * Evaluate zones; advance or start transitions. Call after ecological collapse, same place as other engines.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.ecological_phase_transition_tick_interval', 100);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $zones = &$stateVector['zones'];
        if (!is_array($zones) || empty($zones)) {
            return;
        }

        $durationTicks = max(1, (int) config('worldos.intelligence.ecological_phase_transition_duration_ticks', 50));
        $rainfallDesertMax = (float) config('worldos.intelligence.ecological_phase_transition_rainfall_desert_max', 0.35);
        $rainfallForestMin = (float) config('worldos.intelligence.ecological_phase_transition_rainfall_forest_min', 0.65);
        $seed = (int) ($universe->id ?? 0) * 31 + (int) ($universe->seed ?? 0);

        $zonesModified = false;
        foreach ($zones as $zoneIndex => &$zone) {
            $state = &$zone['state'];
            if (!is_array($state)) {
                $state = [];
            }

            $rainfall = $this->getOrInitRainfall($state, $seed, $currentTick, $zoneIndex);
            $state['rainfall'] = $rainfall;
            $temperature = (float) ($state['temperature'] ?? 0.5);
            $state['temperature'] = $temperature;

            $currentBiome = $this->normalizeBiome($state['ecosystem_state'] ?? 'grassland');
            $targetBiomeFromEnv = $this->rainfallToBiome($rainfall, $rainfallDesertMax, $rainfallForestMin);

            $targetBiome = $state['target_ecosystem_state'] ?? null;
            $targetBiome = $targetBiome ? $this->normalizeBiome($targetBiome) : null;
            $progress = (float) ($state['transition_progress'] ?? 0);

            if ($targetBiome !== null && $progress >= 1.0) {
                $fromState = $currentBiome;
                $state['ecosystem_state'] = $targetBiome;
                unset($state['target_ecosystem_state'], $state['transition_progress']);
                $zonesModified = true;
                $this->chroniclePhaseTransition($universe, $currentTick, $fromState, $targetBiome, $zoneIndex);
                continue;
            }

            if ($targetBiome !== null) {
                $progress += 1.0 / $durationTicks;
                $state['transition_progress'] = min(1.0, $progress);
                $zonesModified = true;
                if ($state['transition_progress'] >= 1.0) {
                    $fromState = $currentBiome;
                    $state['ecosystem_state'] = $targetBiome;
                    unset($state['target_ecosystem_state'], $state['transition_progress']);
                    $this->chroniclePhaseTransition($universe, $currentTick, $fromState, $targetBiome, $zoneIndex);
                }
                continue;
            }

            if ($targetBiomeFromEnv !== $currentBiome) {
                $state['target_ecosystem_state'] = $targetBiomeFromEnv;
                $state['transition_progress'] = 0.0;
                $zonesModified = true;
            } else {
                if (!isset($state['ecosystem_state'])) {
                    $state['ecosystem_state'] = $currentBiome;
                    $zonesModified = true;
                }
            }
        }
        unset($zone, $state);

        if ($zonesModified) {
            $stateVector['zones'] = $zones;
            $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        }
    }

    private function getOrInitRainfall(array &$state, int $seed, int $tick, int $zoneIndex): float
    {
        if (array_key_exists('rainfall', $state) && is_numeric($state['rainfall'])) {
            return max(0.0, min(1.0, (float) $state['rainfall']));
        }
        $phase = ($tick * 0.002 + $zoneIndex * 0.17 + $seed * 0.0001) % 1.0;
        $rainfall = 0.5 + 0.35 * sin($phase * 2 * M_PI);
        return max(0.0, min(1.0, $rainfall));
    }

    private function rainfallToBiome(float $rainfall, float $desertMax, float $forestMin): string
    {
        if ($rainfall <= $desertMax) {
            return 'desert';
        }
        if ($rainfall >= $forestMin) {
            return 'forest';
        }
        return 'grassland';
    }

    private function normalizeBiome(string $b): string
    {
        $b = strtolower(trim($b));
        return in_array($b, self::BIOMES, true) ? $b : 'grassland';
    }

    private function chroniclePhaseTransition(Universe $universe, int $tick, string $fromState, string $toState, int $zoneIndex): void
    {
        $content = sprintf(
            'Ecological phase transition at tick %d: zone %d %s → %s.',
            $tick,
            $zoneIndex,
            $fromState,
            $toState
        );
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'ecological_phase_transition',
            'content' => $content,
            'raw_payload' => [
                'from_state' => $fromState,
                'to_state' => $toState,
                'zone_index' => $zoneIndex,
                'affected_area' => $zoneIndex,
            ],
        ]);
        $this->eventBus->dispatch($universe->id, SimulationEventBus::TYPE_ECOLOGICAL_PHASE_TRANSITION, $tick, [
            'from_state' => $fromState,
            'to_state' => $toState,
            'zone_index' => $zoneIndex,
            'affected_area' => $zoneIndex,
        ]);
        Log::info("EcologicalPhaseTransitionEngine: Universe {$universe->id} zone {$zoneIndex} {$fromState} → {$toState} at tick {$tick}");
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }

    /**
     * Get resource regen factor for a zone (for ProcessActorEnergyAction).
     * During transition, blend from and to biome factors by progress.
     */
    public static function resourceRegenFactorForZone(array $zoneState): float
    {
        $factors = config('worldos.intelligence.ecological_phase_transition_biome_resource_regen', [
            'forest' => 1.2,
            'grassland' => 1.0,
            'desert' => 0.6,
        ]);
        $from = $zoneState['ecosystem_state'] ?? 'grassland';
        $to = $zoneState['target_ecosystem_state'] ?? $from;
        $progress = (float) ($zoneState['transition_progress'] ?? 0);
        $fromFactor = (float) ($factors[$from] ?? $factors['grassland'] ?? 1.0);
        $toFactor = (float) ($factors[$to] ?? $factors['grassland'] ?? 1.0);
        return $fromFactor * (1.0 - $progress) + $toFactor * $progress;
    }
}
