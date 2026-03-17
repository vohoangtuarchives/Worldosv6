<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use Illuminate\Support\Facades\Log;

/**
 * Ecological Phase Transition Engine (Tier 2).
 * EnvironmentState (temperature, rainfall) and EcosystemState (forest, grassland, desert).
 */
final class EcologicalPhaseTransitionEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    private const BIOMES = ['forest', 'grassland', 'desert'];

    public function __construct() {}

    public function phase(): string
    {
        return 'ecology';
    }

    public function name(): string
    {
        return 'ecological_phase_transition';
    }

    public function priority(): int
    {
        return 15;
    }

    public function tickRate(): int
    {
        return (int) \config('worldos.intelligence.ecological_phase_transition_tick_interval', 100);
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $zones = $state->get('zones');
        if (!is_array($zones) || empty($zones)) {
            return EngineResult::empty();
        }

        $durationTicks = max(1, (int) \config('worldos.intelligence.ecological_phase_transition_duration_ticks', 50));
        $rainfallDesertMax = (float) \config('worldos.intelligence.ecological_phase_transition_rainfall_desert_max', 0.35);
        $rainfallForestMin = (float) \config('worldos.intelligence.ecological_phase_transition_rainfall_forest_min', 0.65);
        
        $currentTick = $ctx->getTick();
        $universeId = $ctx->getUniverseId();

        $zonesModified = false;
        $events = [];

        foreach ($zones as $zoneIndex => &$zone) {
            $zoneState = &$zone['state'];
            if (!is_array($zoneState)) {
                $zoneState = [];
            }

            $rainfall = (float) ($zoneState['rainfall'] ?? 0.5);
            $currentBiome = $this->normalizeBiome($zoneState['ecosystem_state'] ?? 'grassland');
            $targetBiomeFromEnv = $this->rainfallToBiome($rainfall, $rainfallDesertMax, $rainfallForestMin);

            $targetBiome = $zoneState['target_ecosystem_state'] ?? null;
            $targetBiome = $targetBiome ? $this->normalizeBiome($targetBiome) : null;
            $progress = (float) ($zoneState['transition_progress'] ?? 0);

            if ($targetBiome !== null && $progress >= 1.0) {
                $fromState = $currentBiome;
                $zoneState['ecosystem_state'] = $targetBiome;
                unset($zoneState['target_ecosystem_state'], $zoneState['transition_progress']);
                $zonesModified = true;
                $events[] = $this->createEvent($ctx, $fromState, $targetBiome, $zoneIndex);
                continue;
            }

            if ($targetBiome !== null) {
                $progress += 1.0 / $durationTicks;
                $zoneState['transition_progress'] = min(1.0, $progress);
                $zonesModified = true;
                if ($zoneState['transition_progress'] >= 1.0) {
                    $fromState = $currentBiome;
                    $zoneState['ecosystem_state'] = $targetBiome;
                    unset($zoneState['target_ecosystem_state'], $zoneState['transition_progress']);
                    $events[] = $this->createEvent($ctx, $fromState, $targetBiome, $zoneIndex);
                }
                continue;
            }

            if ($targetBiomeFromEnv !== $currentBiome) {
                $zoneState['target_ecosystem_state'] = $targetBiomeFromEnv;
                $zoneState['transition_progress'] = 0.0;
                $zonesModified = true;
            } elseif (!isset($zoneState['ecosystem_state'])) {
                $zoneState['ecosystem_state'] = $currentBiome;
                $zonesModified = true;
            }
        }
        unset($zone);

        if ($zonesModified) {
            return new EngineResult($events, [new WorldRulesUpdateEffect(['zones' => $zones])], []);
        }

        return EngineResult::empty();
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

    private function createEvent(TickContext $ctx, string $fromState, string $toState, int $zoneIndex): WorldEvent
    {
        return WorldEvent::create(
            WorldEventType::PHASE_TRANSITION,
            $ctx->getUniverseId(),
            $ctx->getTick(),
            null,
            [],
            0.5,
            [],
            [
                'from_state' => $fromState,
                'to_state' => $toState,
                'zone_index' => $zoneIndex,
            ]
        );
    }

    public static function resourceRegenFactorForZone(array $zoneState): float
    {
        $factors = \config('worldos.intelligence.ecological_phase_transition_biome_resource_regen', [
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
