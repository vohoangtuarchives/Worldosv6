<?php

namespace App\Simulation\Supervisor;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Simulation\EngineRegistry;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates advance flow: EngineDriver → StateSynchronizer → SnapshotManager → EventDispatcher → RuntimePipeline.
 */
final class SimulationSupervisor
{
    public function __construct(
        private readonly UniverseRepositoryInterface $universeRepository,
        private readonly EngineDriver $engineDriver,
        private readonly StateSynchronizer $stateSynchronizer,
        private readonly SnapshotManager $snapshotManager,
        private readonly EventDispatcher $eventDispatcher,
        private readonly RuntimePipeline $runtimePipeline,
        private readonly EngineRegistry $engineRegistry,
        private readonly \App\Simulation\Runtime\EventDrivenScheduler $scheduler,
        private readonly \App\Simulation\Runtime\State\StateManager $stateManager,
    ) {}

    /**
     * @return array{ok: bool, snapshot?: array, error_message?: string, ...}
     */
    public function execute(int $universeId, int $ticks): array
    {
        Log::info('Simulation: advance requested', ['universe_id' => $universeId, 'ticks' => $ticks]);

        $universe = $this->universeRepository->find($universeId);

        if (! $universe || $universe->status === 'halted' || $universe->status === 'restarting') {
            Log::warning('Simulation: advance rejected (universe not found or halted)', ['universe_id' => $universeId]);

            return ['ok' => false, 'error_message' => 'Universe not found, is halted, or is restarting'];
        }
        if (! $universe->world) {
            Log::warning('Simulation: advance rejected (universe has no world)', ['universe_id' => $universeId]);

            return ['ok' => false, 'error_message' => 'Universe has no world'];
        }

        // Phase 70: The Eternal Now (Tickless Model)
        $state = $this->stateManager->get();
        $actualTicks = $ticks;
        
        if ($state) {
            $saliency = $this->scheduler->calculateTimeSaliency($state);
            $jump = $this->scheduler->getTickJump($saliency);
            
            // Nếu thực tại ít biến động, ta có thể "nén" thời gian bằng cách chạy nhiều tick hơn trong 1 request
            if ($jump > 1 && $ticks === 1) {
                $actualTicks = $jump;
                Log::info("Simulation: Time Compression (Tickless). Jumping $jump ticks.");
            }
        }

        $response = $this->engineDriver->advance($universe, $actualTicks);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshotData = $response['snapshot'] ?? [];
        if (empty($snapshotData)) {
            return $response;
        }

        $tickDurationMsPerTick = (float) ($response['_tick_duration_ms_per_tick'] ?? 0.0);
        $engineManifest = $this->engineRegistry->getManifest();

        $this->stateSynchronizer->sync($universe, $snapshotData, $actualTicks, $engineManifest);

        $snapshot = $this->snapshotManager->persistOrVirtual($universe, $snapshotData, $tickDurationMsPerTick, $engineManifest);

        $this->eventDispatcher->dispatchPulsed($universe, $snapshot, $response, $actualTicks, $tickDurationMsPerTick);

        $this->runtimePipeline->run(
            $universe,
            (int) $snapshotData['tick'],
            $snapshot,
            $response,
            $actualTicks
        );

        // Vector 7: Engine Health Monitor Tracking
        if ($snapshot) {
            $durationTotal = $tickDurationMsPerTick * $actualTicks;
            // Target ideal tick is < 50ms per tick. Max penalty at 500ms.
            $healthScore = max(0, min(100, 100 - (($tickDurationMsPerTick - 50) / 4.5)));
            
            $currentMetrics = $snapshot->metrics ?? [];
            $currentMetrics['engine_health'] = round($healthScore, 2);
            $currentMetrics['last_tick_ms'] = round($durationTotal, 2);
            $snapshot->metrics = $currentMetrics;
            if ($snapshot->exists) {
                $snapshot->save();
            }

            if ($tickDurationMsPerTick > 200) {
                Log::warning("SimulationSupervisor: High engine load detected.", [
                    'universe_id' => $universeId,
                    'health_score' => $healthScore,
                    'ms_per_tick' => $tickDurationMsPerTick
                ]);
            }
        }

        // Phase 70: Tick Dilation (Delay)
        if ($state) {
            $delay = $this->scheduler->getOptimalDelay($state);
            if ($delay > 0) {
                usleep($delay * 1000);
            }
        }

        return $response;
    }
}
