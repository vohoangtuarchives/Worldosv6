<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Chronicle;
use App\Models\Universe;
use App\Modules\Intelligence\Domain\Rng\SimulationRng;
use App\Modules\Intelligence\Services\EcosystemMetricsService;
use App\Simulation\SimulationEventBus;
use Illuminate\Support\Facades\Log;

/**
 * Ecological Collapse Engine – detects ecosystem instability and triggers collapse (famine / disease / predator_crash).
 * Modifiers (resource_regen down, death_prob up, reproduction down) are applied by ProcessActorEnergyAction
 * and ProcessActorSurvivalAction when state_vector['ecological_collapse']['active'] is true.
 */
class EcologicalCollapseEngine
{
    public function __construct(
        protected EcosystemMetricsService $ecosystemMetrics,
        protected UniverseRepositoryInterface $universeRepository,
        protected SimulationEventBus $eventBus
    ) {}

    /**
     * Evaluate ecosystem; trigger or end collapse. Call after processActorEnergy/processActorSurvival and after current_tick is updated.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.ecological_collapse_tick_interval', 50);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        $collapse = $stateVector['ecological_collapse'] ?? null;

        if (is_array($collapse) && !empty($collapse['active'])) {
            $untilTick = (int) ($collapse['until_tick'] ?? 0);
            if ($currentTick >= $untilTick) {
                $this->endCollapse($universe, $stateVector, $currentTick);
                return;
            }
            return;
        }

        $metrics = $this->ecosystemMetrics->forUniverse($universe);
        $threshold = (float) config('worldos.intelligence.ecological_collapse_instability_threshold', 0.7);
        if ($metrics['instability_score'] < $threshold) {
            return;
        }

        $this->triggerCollapse($universe, $stateVector, $currentTick, $metrics);
    }

    private function triggerCollapse(Universe $universe, array $stateVector, int $tick, array $metrics): void
    {
        $rng = new SimulationRng((int) ($universe->seed ?? 0), $tick, 700000);
        $durationMin = (int) config('worldos.intelligence.ecological_collapse_duration_min', 200);
        $durationMax = (int) config('worldos.intelligence.ecological_collapse_duration_max', 1000);
        $duration = (int) $rng->floatRange((float) $durationMin, (float) $durationMax);
        if ($duration < $durationMin) {
            $duration = $durationMin;
        }
        if ($duration > $durationMax) {
            $duration = $durationMax;
        }

        $resourceStress = $metrics['resource_stress'] ?? 0;
        $type = $resourceStress >= 0.6 ? 'famine' : ($rng->nextFloat() < 0.5 ? 'disease' : 'predator_crash');

        $stateVector['ecological_collapse'] = [
            'active' => true,
            'type' => $type,
            'since_tick' => $tick,
            'until_tick' => $tick + $duration,
            'population_before' => $metrics['total_population'],
            'instability_score' => $metrics['instability_score'],
        ];

        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);

        $content = sprintf(
            'Ecological collapse triggered at tick %d: %s. Population: %d, instability: %.2f. Recovery expected by tick %d.',
            $tick,
            $type,
            $metrics['total_population'],
            $metrics['instability_score'],
            $tick + $duration
        );
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'ecological_collapse',
            'content' => $content,
            'raw_payload' => [
                'cause' => $type,
                'population_before' => $metrics['total_population'],
                'instability_score' => $metrics['instability_score'],
                'until_tick' => $tick + $duration,
                'since_tick' => $tick,
            ],
        ]);
        $this->eventBus->dispatch($universe->id, SimulationEventBus::TYPE_ECOLOGICAL_COLLAPSE, $tick, [
            'cause' => $type,
            'population_before' => $metrics['total_population'],
            'instability_score' => $metrics['instability_score'],
            'until_tick' => $tick + $duration,
        ]);

        Log::info("EcologicalCollapseEngine: Universe {$universe->id} collapse triggered at tick {$tick}", [
            'type' => $type,
            'instability_score' => $metrics['instability_score'],
            'until_tick' => $tick + $duration,
        ]);
    }

    private function endCollapse(Universe $universe, array $stateVector, int $tick): void
    {
        $recoveryTicks = (int) config('worldos.intelligence.ecological_collapse_recovery_ticks', 100);
        $stateVector['ecological_collapse'] = [
            'active' => false,
            'recovery_until_tick' => $tick + $recoveryTicks,
        ];
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'ecological_collapse_recovery',
            'content' => "Ecological collapse ended at tick {$tick}. Recovery phase until tick " . ($tick + $recoveryTicks) . '.',
            'raw_payload' => ['recovery_until_tick' => $tick + $recoveryTicks],
        ]);
        $this->eventBus->dispatch($universe->id, SimulationEventBus::TYPE_ECOLOGICAL_COLLAPSE_RECOVERY, $tick, [
            'recovery_until_tick' => $tick + $recoveryTicks,
        ]);

        Log::info("EcologicalCollapseEngine: Universe {$universe->id} collapse ended at tick {$tick}");
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
