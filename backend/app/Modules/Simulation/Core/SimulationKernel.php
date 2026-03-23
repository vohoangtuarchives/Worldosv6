<?php

namespace App\Modules\Simulation\Core;

use App\Models\TickManifest;
use App\Modules\Simulation\Core\Contracts\Effect;
use App\Modules\Simulation\Core\Contracts\WorldEventBusInterface;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\ReadOnlyWorldState;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Events\WorldEvent;
use App\Modules\Simulation\Core\Domain\SimulationTickResult;
use App\Modules\Simulation\Core\Domain\EngineExecutionRecord;
use App\Modules\Simulation\Core\Services\TickMetricsService;
use App\Modules\Simulation\Core\Contracts\SimulationEngine;

/**
 * Simulation Kernel: runs registered engines by priority, collects state changes (effects), resolves them, returns new WorldState.
 * Emits engine result events via WorldEventBus (doc §3, §4).
 * Phase 4: Engines annotated with isParallelSafe()=true within the same phase group are executed concurrently via PHP Fibers.
 */
final class SimulationKernel
{
    public function __construct(
        private readonly EffectResolver $effectResolver,
        private readonly EngineRegistry $registry,
        private readonly WorldEventBusInterface $eventBus,
        private readonly TickMetricsService $metricsService,
    ) {
    }

    public function runTick(WorldState $state, TickContext $ctx): SimulationTickResult
    {
        $tickStartTime = microtime(true);
        $skippedEngines = [];
        $executionRecords = [];
        
        $tick = $state->getTick();
        $allEffects = [];
        $allEvents = [];
        $allCausalLinks = [];
        $allActiveEngines = [];
        
        // Phase 5: Enforce read-only state for engines
        $readOnlyState = new ReadOnlyWorldState($state);

        // Group active engines by phase, preserving order from EngineRegistry::getOrdered()
        $phaseGroups = [];
        foreach ($this->registry->getOrdered() as $engine) {
            $factor = $engine->tickRate();
            if ($factor < 1 || ($tick % $factor) !== 0) {
                continue;
            }
            $phaseGroups[$engine->phase()][] = $engine;
            $allActiveEngines[] = $engine;
        }

        // Execute each phase group in sequence; within a group, run parallel-safe engines concurrently
        foreach ($phaseGroups as $phase => $engines) {
            // Split into parallel-safe batch vs sequential remainder
            $parallelBatch  = array_filter($engines, fn($e) => $e->isParallelSafe());
            $sequentialList = array_filter($engines, fn($e) => !$e->isParallelSafe());

            // --- Parallel dispatch (PHP Fibers cooperative concurrency) ---
            if (!empty($parallelBatch)) {
                $fibers = [];
                foreach ($parallelBatch as $engine) {
                    $elapsed = microtime(true) - $tickStartTime;
                    $priority = $engine->priorityCategory();

                    if ($priority === 'COSMETIC' && $elapsed > 0.5) {
                        $skippedEngines[] = $engine->name();
                        $executionRecords[] = new EngineExecutionRecord($engine->name(), 0, 0, 0, $priority, true);
                        continue;
                    }
                    if ($priority === 'STOCHASTIC' && $elapsed > 0.8) {
                        $skippedEngines[] = $engine->name();
                        $executionRecords[] = new EngineExecutionRecord($engine->name(), 0, 0, 0, $priority, true);
                        continue;
                    }

                    $fiber = new \Fiber(function () use ($engine, $readOnlyState, $ctx): \App\Modules\Simulation\Core\Engines\EngineResult {
                        $eStart = microtime(true);
                        $res = $engine->handle($readOnlyState, $ctx);
                        $res->metrics['_kernel_elapsed_ms'] = (microtime(true) - $eStart) * 1000;
                        return $res;
                    });
                    $fiber->start();
                    $fibers[] = [$fiber, $engine];
                }
                // Collect results — resume any suspended fibers until all terminate
                foreach ($fibers as [$fiber, $engine]) {
                    while (!$fiber->isTerminated()) {
                        $fiber->resume();
                    }
                    $result = $fiber->getReturn();
                    foreach ($result->stateChanges as $effect) {
                        if ($effect instanceof Effect) {
                            $allEffects[] = $effect;
                        }
                    }
                    foreach ($result->events as $ev) {
                        $allEvents[] = $ev;
                    }
                    foreach ($result->causalLinks as $type => $pid) {
                        $allCausalLinks[$type] = $pid;
                    }
                    $this->emitEvents($result->events, $ctx, $result->causalLinks);

                    $executionRecords[] = new EngineExecutionRecord(
                        $engine->name(),
                        (float) ($result->metrics['_kernel_elapsed_ms'] ?? 0),
                        count($result->stateChanges),
                        count($result->events),
                        $engine->priorityCategory(),
                        false
                    );
                }
            }

            // --- Sequential dispatch ---
            foreach ($sequentialList as $engine) {
                $elapsed = microtime(true) - $tickStartTime;
                $priority = $engine->priorityCategory();

                if ($priority === 'COSMETIC' && $elapsed > 0.5) {
                    $skippedEngines[] = $engine->name();
                    $executionRecords[] = new EngineExecutionRecord($engine->name(), 0, 0, 0, $priority, true);
                    continue;
                }
                if ($priority === 'STOCHASTIC' && $elapsed > 0.8) {
                    $skippedEngines[] = $engine->name();
                    $executionRecords[] = new EngineExecutionRecord($engine->name(), 0, 0, 0, $priority, true);
                    continue;
                }

                $eStart = microtime(true);
                $result = $engine->handle($readOnlyState, $ctx);
                $eElapsed = (microtime(true) - $eStart) * 1000;

                $executionRecords[] = new EngineExecutionRecord(
                    $engine->name(),
                    $eElapsed,
                    count($result->stateChanges),
                    count($result->events),
                    $priority,
                    false
                );
                foreach ($result->stateChanges as $effect) {
                    if ($effect instanceof Effect) {
                        $allEffects[] = $effect;
                    }
                }
                foreach ($result->events as $ev) {
                    $allEvents[] = $ev;
                }
                foreach ($result->causalLinks as $type => $pid) {
                    $allCausalLinks[$type] = $pid;
                }
                $this->emitEvents($result->events, $ctx, $result->causalLinks);
            }
        }

        if (!empty($skippedEngines)) {
            \Illuminate\Support\Facades\Log::warning('SimulationKernel: Throttled engines due to time constraints.', [
                'universe_id' => $ctx->getUniverseId(),
                'tick' => $tick,
                'elapsed' => microtime(true) - $tickStartTime,
                'skipped_engines' => $skippedEngines
            ]);
        }

        // Phase 4: Pre-resolve snapshot for rollback on failure
        $preResolveSnapshot = $state->snapshot();

        try {
            $newState = $this->effectResolver->resolve($state, $allEffects);
            $finalResult = new SimulationTickResult($newState, $allEvents, $allCausalLinks, $executionRecords);
            
            $this->metricsService->recordTick($ctx->getUniverseId(), $finalResult, $ctx->getTick());
            
            try {
                TickManifest::create([
                    'universe_id'     => $ctx->getUniverseId(),
                    'tick'           => $ctx->getTick(),
                    'seed'           => $ctx->getSeed(),
                    'engines_ran'     => array_values(array_diff(array_map(fn($e) => $e->name(), $allActiveEngines), $skippedEngines)),
                    'engines_skipped' => $skippedEngines,
                    'effects'         => array_map(fn($eff) => [
                        'type' => get_class($eff),
                        'data' => (method_exists($eff, 'toArray')) ? $eff->toArray() : (array)$eff
                    ], $allEffects),
                    'events'          => array_map(fn($ev) => ($ev instanceof WorldEvent) ? $ev->toArray() : (array)$ev, $allEvents),
                    'elapsed_ms'      => (microtime(true) - $tickStartTime) * 1000,
                ]);
            } catch (\Throwable $manifestError) {
                \Illuminate\Support\Facades\Log::error('SimulationKernel: Failed to save TickManifest', [
                    'universe_id' => $ctx->getUniverseId(),
                    'tick'        => $ctx->getTick(),
                    'error'       => $manifestError->getMessage(),
                ]);
            }

            return $finalResult;
        } catch (\Throwable $e) {
            $state->restoreFrom($preResolveSnapshot);
            \Illuminate\Support\Facades\Log::error('SimulationKernel: Effect resolution failed, state rolled back.', [
                'universe_id' => $ctx->getUniverseId(),
                'tick'        => $ctx->getTick(),
                'error'       => $e->getMessage(),
            ]);
            
            $failResult = new SimulationTickResult($state, [], [], $executionRecords);
            $this->metricsService->recordTick($ctx->getUniverseId(), $failResult, $ctx->getTick());
            
            return $failResult;
        }
    }

    /**
     * @param array<WorldEvent|array> $events
     */
    private function emitEvents(array $events, TickContext $ctx, array $causalLinks = []): void
    {
        foreach ($events as $ev) {
            $parentId = null;
            $type = ($ev instanceof WorldEvent) ? $ev->type : ($ev['type'] ?? 'unknown');

            // Resolve parentId from causalLinks (by type or by explicit event id if provided)
            if (isset($causalLinks[$type])) {
                $parentId = $causalLinks[$type];
            }

            if ($ev instanceof WorldEvent) {
                // If it's already a WorldEvent, we need to recreate it if we want to change parentId, 
                // but since it's immutable, we check if it already has one.
                if ($ev->parentId === null && $parentId !== null) {
                    $ev = new WorldEvent(
                        $ev->id, $ev->type, $ev->universeId, $ev->tick, $ev->location,
                        $ev->actors, $ev->impactScore, $ev->causes, $ev->payload, $parentId
                    );
                }
                $this->eventBus->publish($ev);
                continue;
            }
            if (is_array($ev)) {
                $this->eventBus->publish(WorldEvent::create(
                    $type,
                    $ctx->getUniverseId(),
                    $ctx->getTick(),
                    $ev['location'] ?? null,
                    $ev['actors'] ?? [],
                    (float) ($ev['impact_score'] ?? 0),
                    $ev['causes'] ?? [],
                    $ev['payload'] ?? $ev,
                    $parentId
                ));
            }
        }
    }
}


