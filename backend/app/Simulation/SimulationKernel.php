<?php

namespace App\Simulation;

use App\Simulation\Contracts\Effect;
use App\Simulation\Contracts\WorldEventBusInterface;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\WorldState;
use App\Simulation\Events\WorldEvent;

/**
 * Simulation Kernel: runs registered engines by priority, collects state changes (effects), resolves them, returns new WorldState.
 * Emits engine result events via WorldEventBus (doc §3, §4).
 */
final class SimulationKernel
{
    public function __construct(
        private readonly EffectResolver $effectResolver,
        private readonly EngineRegistry $registry,
        private readonly WorldEventBusInterface $eventBus,
    ) {
    }

    public function runTick(WorldState $state, TickContext $ctx): WorldState
    {
        $tick = $state->getTick();
        $allEffects = [];
        foreach ($this->registry->getOrdered() as $engine) {
            $factor = $engine->tickRate();
            if ($factor < 1 || ($tick % $factor) !== 0) {
                continue;
            }
            $result = $engine->handle($state, $ctx);
            foreach ($result->stateChanges as $effect) {
                if ($effect instanceof Effect) {
                    $allEffects[] = $effect;
                }
            }
            $this->emitEvents($result->events, $ctx);
        }
        return $this->effectResolver->resolve($state, $allEffects);
    }

    /**
     * @param array<WorldEvent|array> $events
     */
    private function emitEvents(array $events, TickContext $ctx): void
    {
        foreach ($events as $ev) {
            if ($ev instanceof WorldEvent) {
                $this->eventBus->publish($ev);
                continue;
            }
            if (is_array($ev)) {
                $this->eventBus->publish(WorldEvent::create(
                    $ev['type'] ?? 'unknown',
                    $ctx->getUniverseId(),
                    $ctx->getTick(),
                    $ev['location'] ?? null,
                    $ev['actors'] ?? [],
                    (float) ($ev['impact_score'] ?? 0),
                    $ev['causes'] ?? [],
                    $ev['payload'] ?? $ev
                ));
            }
        }
    }
}
