<?php

namespace App\Simulation\Supervisor;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Events\Simulation\UniverseSimulationPulsed;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches UniverseSimulationPulsed and updates universe (current_tick, fitness_score, structural_coherence).
 */
final class EventDispatcher
{
    public function __construct(
        private readonly UniverseRepositoryInterface $universeRepository,
    ) {}

    public function dispatchPulsed(Universe $universe, UniverseSnapshot $snapshot, array $engineResponse, int $ticks, float $tickDurationMsPerTick): void
    {
        event(new UniverseSimulationPulsed(
            $universe,
            $snapshot,
            array_merge($engineResponse, ['_ticks' => $ticks])
        ));

        Cache::put("worldos.tick_duration_ms.{$universe->id}", $tickDurationMsPerTick, now()->addHours(1));

        Log::info('Simulation: advance completed', [
            'universe_id' => $universe->id,
            'ticks' => $ticks,
            'tick' => $snapshot->tick,
            'entropy' => $snapshot->entropy,
            'tick_duration_ms' => round($tickDurationMsPerTick, 2),
        ]);

        $snapshotData = $engineResponse['snapshot'] ?? [];
        $this->universeRepository->update($universe->id, ['current_tick' => $snapshotData['tick'] ?? $snapshot->tick]);

        $universe->refresh();
        $universe->structural_coherence = min(1.0, $universe->structural_coherence + $universe->observer_bonus);
        if ((int) ($snapshot->tick) % 10 === 0) {
            $universe->fitness_score = app(\App\Services\Simulation\KernelMutationService::class)->calculateFitness($universe);
        }
        $universe->save();
    }
}
