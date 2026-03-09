<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\ZoneNeighborsUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Services\TopologyResolver;
use App\Simulation\Support\SimulationRandom;

/**
 * Adaptive topology: occasionally rewires zone neighbor links (dynamic edges).
 * Fixed nodes; edges change over time so connectivity evolves (e.g. culture-driven or random).
 */
final class AdaptiveTopologyEngine implements SimulationEngine
{
    private const REWIRE_CHANCE = 0.12;

    public function __construct(
        private readonly TopologyResolver $topology,
    ) {
    }

    public function name(): string
    {
        return 'adaptive_topology';
    }

    public function priority(): int
    {
        return 5;
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.adaptive_topology') ?? 50));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rng = new SimulationRandom($ctx->getSeed(), $ctx->getTick(), 0);
        $effects = $this->evaluate($state, $rng);
        $events = [];
        if ($effects !== []) {
            $events[] = WorldEvent::create(
                WorldEventType::TOPOLOGY_REWIRED,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.2,
                [],
                ['source' => 'adaptive_topology']
            );
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

        $zones = array_values($zones);
        $count = count($zones);

        if ($rng->float(0, 1) > self::REWIRE_CHANCE) {
            return [];
        }

        $idByIndex = [];
        $neighborsByIdx = [];
        for ($i = 0; $i < $count; $i++) {
            $id = $zones[$i]['id'] ?? $i;
            $idByIndex[$i] = $id;
            $neighborIndices = $this->topology->getNeighborIndices($zones, $i);
            $neighborsByIdx[$i] = array_map(fn (int $idx) => $zones[$idx]['id'] ?? $idx, $neighborIndices);
        }

        $i = $rng->int(0, $count - 1);
        $addLink = $rng->float(0, 1) > 0.5;
        $current = $neighborsByIdx[$i];
        $myId = $idByIndex[$i];

        if ($addLink) {
            $candidates = [];
            for ($j = 0; $j < $count; $j++) {
                if ($j === $i) {
                    continue;
                }
                $otherId = $idByIndex[$j];
                if (!in_array($otherId, $current, true)) {
                    $candidates[] = $otherId;
                }
            }
            if (empty($candidates)) {
                return [];
            }
            $newId = $candidates[$rng->int(0, count($candidates) - 1)];
            $neighborsByIdx[$i] = array_values(array_merge($current, [$newId]));
        } else {
            if (empty($current)) {
                return [];
            }
            $removeId = $current[$rng->int(0, count($current) - 1)];
            $neighborsByIdx[$i] = array_values(array_filter($current, fn ($id) => $id !== $removeId));
        }

        return [new ZoneNeighborsUpdateEffect([$i => $neighborsByIdx[$i]])];
    }
}
