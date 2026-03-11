<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Log;

/**
 * Civilization Discovery Engine (Doc §36): genome, evolutionary search, fitness evaluation.
 * Writes state_vector.civilization.discovery.fitness when run every N ticks.
 */
final class CivilizationDiscoveryService
{
    public const GOVERNANCE_TYPES = ['tribal', 'chiefdom', 'kingdom', 'republic', 'federation'];
    public const ECONOMIC_TYPES = ['subsistence', 'trade', 'industrial', 'knowledge'];
    public const BELIEF_TYPES = ['animist', 'theistic', 'philosophical', 'secular'];

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function fitness(
        float $lifespanYears,
        float $innovationRate,
        float $populationPeak,
        float $stabilityScore,
        float $culturalRichness
    ): float {
        return $lifespanYears * 0.3
            + $innovationRate * 100 * 0.2
            + $populationPeak * 0.2
            + $stabilityScore * 100 * 0.2
            + $culturalRichness * 0.1;
    }

    /**
     * Compute discovery fitness from universe/snapshot and write to state_vector.civilization.discovery.
     */
    public function evaluate(Universe $universe, int $currentTick, ?UniverseSnapshot $snapshot = null): void
    {
        $interval = (int) config('worldos.civilization_discovery.fitness_interval', 10);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $universe->refresh();
        $stateVector = $this->getStateVector($universe);
        $ticksPerYear = max(1, (int) config('worldos.intelligence.ticks_per_year', config('worldos.emergence.ticks_per_year', 12)));
        $lifespanYears = $currentTick / $ticksPerYear;
        $innovationRate = (float) ($stateVector['innovation'] ?? $stateVector['knowledge_core'] ?? 0.5);
        $economy = $stateVector['civilization']['economy'] ?? [];
        $populationPeak = (float) ($economy['total_surplus'] ?? 0) + (float) ($economy['total_consumption'] ?? 0);
        if ($populationPeak <= 0) {
            $settlements = $stateVector['civilization']['settlements'] ?? [];
            foreach ($settlements as $s) {
                $populationPeak += (float) ($s['population'] ?? 0);
            }
        }
        $populationPeak = max(0, $populationPeak);
        $stabilityScore = $snapshot ? (float) $snapshot->stability_index : (float) ($stateVector['stability_index'] ?? $stateVector['sci'] ?? 0.5);
        $culturalRichness = (float) ($stateVector['cognitive_aggregate']['civilization_tendency'] ?? 0.5);
        if (isset($stateVector['knowledge_graph']['nodes'])) {
            $culturalRichness = min(1.0, 0.3 + 0.1 * count($stateVector['knowledge_graph']['nodes']));
        }

        $fitnessValue = $this->fitness($lifespanYears, $innovationRate, $populationPeak, $stabilityScore, $culturalRichness);
        $civilization = $stateVector['civilization'] ?? [];
        $civilization['discovery'] = [
            'fitness' => round($fitnessValue, 4),
            'updated_tick' => $currentTick,
        ];
        $stateVector['civilization'] = $civilization;
        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("CivilizationDiscoveryService: Universe {$universe->id} discovery.fitness={$fitnessValue} at tick {$currentTick}");
    }

    /**
     * Stub for evolutionary search / GA: run one generation (evaluate fitness, optional selection).
     * When implemented: evaluate fitness for each universe, apply selection/crossover/mutate, return next generation IDs.
     *
     * @param  array<int>  $universeIds
     * @return array{evaluated: array<int>, selected: array<int>}
     */
    public function runGeneration(array $universeIds): array
    {
        return [
            'evaluated' => $universeIds,
            'selected' => $universeIds,
        ];
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
