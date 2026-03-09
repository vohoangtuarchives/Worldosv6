<?php

namespace App\Simulation\Engines;

use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;
use App\Simulation\Effects\StructuralDecayEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Support\SimulationRandom;

/**
 * Anti-freeze: when the world is too stable (low entropy, high order),
 * injects a small structural decay (entropy up, order down) so the simulation
 * does not freeze in a permanent equilibrium.
 */
final class StructuralDecayEngine implements SimulationEngine
{
    /** Order above this with entropy below threshold triggers decay */
    private const ORDER_HIGH_THRESHOLD = 0.75;
    /** Entropy below this with order above threshold triggers decay */
    private const ENTROPY_LOW_THRESHOLD = 0.35;
    /** Max entropy injection per tick when decay runs */
    private const ENTROPY_INJECTION = 0.008;
    /** Max order reduction per tick when decay runs */
    private const ORDER_DECAY = -0.005;

    public function name(): string
    {
        return 'structural_decay';
    }

    public function priority(): int
    {
        return 3;
    }

    public function tickRate(): int
    {
        return max(1, (int) (config('worldos.time_scale_factors.structural_decay') ?? 5));
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $rng = new SimulationRandom($ctx->getSeed(), $ctx->getTick(), 0);
        $effects = $this->evaluate($state, $rng);
        $events = [];
        if ($effects !== []) {
            $events[] = WorldEvent::create(
                WorldEventType::STRUCTURAL_DECAY,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.1,
                [],
                ['trigger' => 'anti_freeze']
            );
        }
        return new EngineResult($events, $effects, []);
    }

    /**
     * @return \App\Simulation\Contracts\Effect[]
     */
    private function evaluate(WorldState $state, SimulationRandom $rng): array
    {
        $entropy = $state->getEntropy();
        $order = (float) $state->getStateVectorKey('order', 0.5);

        $tooStable = $entropy < self::ENTROPY_LOW_THRESHOLD && $order > self::ORDER_HIGH_THRESHOLD;
        if (!$tooStable) {
            return [];
        }

        $entropyDelta = self::ENTROPY_INJECTION * (1.0 + $rng->float(-0.2, 0.2));
        $orderDelta = self::ORDER_DECAY * (1.0 + $rng->float(-0.2, 0.2));

        return [new StructuralDecayEffect($entropyDelta, $orderDelta)];
    }
}
