<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\ZoneCultureUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Services\TopologyResolver;
use App\Simulation\Support\SimulationRandom;
use function config;
use function max;
use function array_values;
use function count;
use function is_array;

/**
 * Culture/ideology/myth drift and diffusion between zones (kernel engine).
 * Uses dual topology for neighbors; deterministic via SimulationRandom.
 */
final class CulturalDriftEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function phase(): string
    {
        return 'culture';
    }

    private const DIMENSIONS = ['tradition', 'innovation', 'trust', 'violence', 'respect', 'myth'];
    private const DRIFT_EPSILON = 0.001;
    private const DIFFUSION_BETA = 0.005;

    public function __construct(
        private readonly TopologyResolver $topology,
        protected \App\Services\Simulation\RuleVmService $ruleVm,
    ) {
    }

    public function name(): string
    {
        return 'cultural_drift';
    }

    public function priority(): int
    {
        return 9;
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.cultural_drift') ?? 3));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rng = new SimulationRandom($ctx->getSeed(), $ctx->getTick(), 0);
        $effects = $this->evaluate($state, $rng);
        $events = [];
        if ($effects !== []) {
            $zonesCount = $state->getZones() ? count($state->getZones()) : 0;
            $events[] = WorldEvent::create(
                WorldEventType::CULTURAL_DRIFT,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.2,
                [],
                ['zones_updated' => $zonesCount]
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
        if (empty($zones)) {
            return [];
        }

        // Pure State: directly mutate via evaluateAndApplyWithState (uses WorldState)
        $this->ruleVm->evaluateAndApplyWithState($state, 'ideology/propagation', (int) $state->get('tick', 0));

        $modifiedZones = $state->get('zones', []);
        $newCultures = [];
        foreach ($modifiedZones as $idx => $z) {
            $newCultures[$idx] = $this->getCulture($z);
        }

        return [new ZoneCultureUpdateEffect($newCultures)];
    }

    /** @return array<string, float> */
    private function getCulture(array $zone): array
    {
        $state = $zone['state'] ?? [];
        $culture = $state['culture'] ?? $zone['culture'] ?? null;
        if (is_array($culture)) {
            $out = [];
            foreach (self::DIMENSIONS as $d) {
                $out[$d] = (float) ($culture[$d] ?? 0.5);
            }
            return $out;
        }
        return [
            'tradition' => 0.5,
            'innovation' => 0.1,
            'trust' => 0.7,
            'violence' => 0.1,
            'respect' => 0.6,
            'myth' => 0.8,
        ];
    }
}
