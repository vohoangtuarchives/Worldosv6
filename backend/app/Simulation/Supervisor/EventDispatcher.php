<?php

namespace App\Simulation\Supervisor;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Events\Simulation\UniverseSimulationPulsed;
use App\Modules\Simulation\Entities\UniverseEntity;
use App\Modules\Simulation\Entities\SnapshotEntity;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches UniverseSimulationPulsed and updates universe (current_tick, fitness_score, structural_coherence).
 */
final class EventDispatcher
{
    public function __construct(
        private readonly \App\Modules\Simulation\Contracts\UniverseRepositoryInterface $universeRepository,
    ) {}

    public function dispatchPulsed(UniverseEntity $universe, SnapshotEntity $snapshot, array $engineResponse, int $ticks, float $tickDurationMsPerTick): void
    {
        // Vẫn cần Model cho Event (UniverseSimulationPulsed) nếu Event chưa refactor
        $universeModel = \App\Models\Universe::find($universe->id);
        $snapshotModel = \App\Models\UniverseSnapshot::find($snapshot->id);

        if ($universeModel && $snapshotModel) {
            event(new \App\Events\Simulation\UniverseSimulationPulsed(
                $universeModel,
                $snapshotModel,
                array_merge($engineResponse, ['_ticks' => $ticks])
            ));
        }

        Cache::put("worldos.tick_duration_ms.{$universe->id}", $tickDurationMsPerTick, now()->addHours(1));

        Log::info('Simulation: advance completed', [
            'universe_id' => $universe->id,
            'ticks' => $ticks,
            'tick' => $snapshot->tick,
            'entropy' => $snapshot->entropy,
            'tick_duration_ms' => round($tickDurationMsPerTick, 2),
        ]);

        // Cập nhật Entity thông qua logic domain
        $universe->currentTick = (int) ($engineResponse['snapshot']['tick'] ?? $snapshot->tick);
        
        $universe->structuralCoherence = min(1.0, $universe->structuralCoherence + ($universe->observerBonus ?? 0));
        
        if ($universe->currentTick % 10 === 0) {
            $universe->fitnessScore = app(\App\Services\Simulation\KernelMutationService::class)->calculateFitness(\App\Models\Universe::find($universe->id));
        }

        $this->universeRepository->save($universe);
    }
}
