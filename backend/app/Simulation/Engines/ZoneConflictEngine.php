<?php

namespace App\Simulation\Engines;

use App\Models\InstitutionalEntity;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\ZoneConquestEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Support\SimulationRandom;

/**
 * Effect-based Zone Conflict engine for Simulation Kernel.
 * Evaluates zones from WorldState, emits ZoneConquestEffect only (no DB writes).
 * Chronicle/BranchEvent/Material plunder are left to listener or ChronicleWriter.
 */
final class ZoneConflictEngine implements SimulationEngine
{
    public function name(): string
    {
        return 'zone_conflict';
    }

    public function priority(): int
    {
        return 7;
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.zone_conflict') ?? 1));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rng = new SimulationRandom($ctx->getSeed(), $ctx->getTick(), 0);
        $effects = $this->evaluate($state, $rng);
        $events = [];
        foreach ($effects as $effect) {
            if ($effect instanceof ZoneConquestEffect) {
                $events[] = WorldEvent::create(
                    WorldEventType::ZONE_CONFLICT,
                    $ctx->getUniverseId(),
                    $ctx->getTick(),
                    $effect->getLoserZoneId(),
                    [$effect->getWinnerZoneId(), $effect->getLoserZoneId()],
                    0.5,
                    [],
                    ['winner' => $effect->getWinnerZoneId(), 'loser' => $effect->getLoserZoneId()]
                );
            }
        }
        return new EngineResult($events, $effects, []);
    }

    /**
     * @return \App\Simulation\Contracts\Effect[]
     */
    private function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $zones = $state->getZones();
        if (count($zones) < 2) {
            return [];
        }

        $stateVector = $state->getStateVector();
        $diplomacy = $stateVector['diplomacy'] ?? [];
        $civMap = $this->buildZoneCivMap($state->getUniverseId());
        $effects = [];
        $numZones = count($zones);

        for ($i = 0; $i < $numZones; $i++) {
            $zoneA = $zones[$i];
            $neighborIndex = ($i + 1) % $numZones;
            $zoneB = $zones[$neighborIndex];

            $civAId = $civMap[$zoneA['id']] ?? null;
            $civBId = $civMap[$zoneB['id']] ?? null;
            if ($civAId && $civBId && $civAId === $civBId) {
                continue;
            }

            $isWar = false;
            if ($civAId && $civBId) {
                $relKey = $this->getRelationKey((int) $civAId, (int) $civBId);
                $isWar = ($diplomacy[$relKey]['status'] ?? 'NEUTRAL') === 'WAR';
            } else {
                $isWar = true;
            }

            $orderA = $this->getZoneMetric($zoneA, 'order');
            $entropyB = $this->getZoneMetric($zoneB, 'entropy');
            $orderB = $this->getZoneMetric($zoneB, 'order');

            $warThreshold = (float) config('worldos.potential_field_war_threshold', 0.85);
            $pressuresA = WorldState::getZonePressures($zoneA);
            $pressuresB = WorldState::getZonePressures($zoneB);
            $highWarPressure = ($pressuresA['war_pressure'] > $warThreshold || $pressuresB['war_pressure'] > $warThreshold);

            $orderEntropyConflict = $orderA > 0.7 && $entropyB > 0.6 && ($orderA - $orderB) > 0.3 && $isWar;
            if ($orderEntropyConflict || ($highWarPressure && $isWar)) {
                $effects[] = new ZoneConquestEffect((string) $zoneA['id'], (string) $zoneB['id']);
            }
        }

        return $effects;
    }

    private function buildZoneCivMap(int $universeId): array
    {
        $civs = InstitutionalEntity::where('universe_id', $universeId)
            ->where('entity_type', 'CIVILIZATION')
            ->whereNull('collapsed_at_tick')
            ->get();

        $map = [];
        foreach ($civs as $civ) {
            foreach ($civ->influence_map ?? [] as $zoneId) {
                $map[$zoneId] = $civ->id;
            }
        }
        return $map;
    }

    private function getRelationKey(int $id1, int $id2): string
    {
        $ids = [$id1, $id2];
        sort($ids);
        return "rel_{$ids[0]}_{$ids[1]}";
    }

    private function getZoneMetric(array $zone, string $key): float
    {
        if (isset($zone['state']) && is_array($zone['state'])) {
            return (float) ($zone['state'][$key] ?? 0);
        }
        return 0.0;
    }
}
