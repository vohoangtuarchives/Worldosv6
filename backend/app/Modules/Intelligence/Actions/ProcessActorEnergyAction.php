<?php

namespace App\Modules\Intelligence\Actions;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;
use App\Modules\Intelligence\Domain\Rng\SimulationRng;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Energy Economy: consume metabolism, gather from zone, starvation, death when energy <= 0.
 * Reproduction (Phase 2b): spawn child with mutated genome when energy > cost.
 * Run after syncUniverseFromSnapshotData and before ProcessActorSurvivalAction.
 */
class ProcessActorEnergyAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository,
        private UniverseRepositoryInterface $universeRepository,
        private SpawnActorAction $spawnActorAction,
        private \App\Modules\Intelligence\Services\EvolutionPressureService $evolutionPressure
    ) {}

    public function handle(Universe $universe, array $simulationResponse): void
    {
        $actors = $this->actorRepository->findByUniverse($universe->id);
        $ticks = max(1, (int) ($simulationResponse['_ticks'] ?? 1));

        $metabolismBase = (float) config('worldos.intelligence.metabolism_base', 0.5);
        $energyMaxDefault = (float) config('worldos.intelligence.energy_max_default', 200);
        $starvationThreshold = (float) config('worldos.intelligence.starvation_threshold', 20);
        $gatherRate = (float) config('worldos.intelligence.gather_rate', 5);
        $resourceRegenRate = (float) config('worldos.intelligence.resource_regen_rate', 2);
        $reproduceCost = (float) config('worldos.intelligence.reproduce_cost', 80);
        $reproduceEnergyRatioChild = (float) config('worldos.intelligence.reproduce_energy_ratio_child', 0.3);
        $mutationRate = (float) config('worldos.intelligence.mutation_rate', 0.05);
        $snapshotTick = (int) (($simulationResponse['snapshot'] ?? [])['tick'] ?? $universe->current_tick ?? 0);

        $zones = $this->getZonesFromUniverse($universe);
        $stateVector = is_array($universe->state_vector) ? $universe->state_vector : [];
        $zonesModified = false;
        $pressure = $this->evolutionPressure->fromUniverse($universe);

        $ecologicalCollapse = $stateVector['ecological_collapse'] ?? null;
        $collapseActive = is_array($ecologicalCollapse) && !empty($ecologicalCollapse['active'])
            && $snapshotTick <= (int) ($ecologicalCollapse['until_tick'] ?? PHP_INT_MAX);
        if ($collapseActive && $resourceRegenRate > 0) {
            $resourceRegenRate *= (float) config('worldos.intelligence.ecological_collapse_resource_regeneration_factor', 0.5);
        }

        foreach ($actors as $actor) {
            if (!$actor->isAlive) {
                continue;
            }

            $metrics = $actor->metrics ?? [];
            $metrics = $this->ensureEnergyMetrics($metrics, $actor->traits ?? [], $actor->metrics['physic'] ?? null, $energyMaxDefault, $metabolismBase);

            // Consume metabolism
            $metabolism = (float) ($metrics['metabolism'] ?? $metabolismBase);
            $energy = (float) ($metrics['energy'] ?? $energyMaxDefault);
            $maxEnergy = (float) ($metrics['max_energy'] ?? $energyMaxDefault);
            $energy -= $metabolism * $ticks;

            // Gather from zone
            if (!empty($zones)) {
                $zoneIndex = abs($actor->id ?? 0) % count($zones);
                $zone = &$zones[$zoneIndex];
                $foodKey = isset($zone['state']['food']) ? 'food' : 'resources';
                $available = (float) ($zone['state'][$foodKey] ?? 0);
                $gather = min($gatherRate * $ticks, $available, max(0, $maxEnergy - $energy));
                if ($gather > 0) {
                    $energy += $gather;
                    if (!isset($zone['state'])) {
                        $zone['state'] = [];
                    }
                    $zone['state'][$foodKey] = max(0, $available - $gather);
                    $zonesModified = true;
                }
            }

            $energy = max(0, min($maxEnergy, $energy));

            // Reproduction: energy > cost, roll with fertility (longevity) and fitness
            if ($energy > $reproduceCost) {
                $longevity = (float) ($actor->traits[17] ?? $actor->traits['Longevity'] ?? 0.5);
                $fitness = $this->evolutionPressure->fitness($actor->traits ?? [], $actor->metrics['physic'] ?? null, $pressure);
                $reproduceProb = 0.08 * max(0, min(1, $longevity)) * $fitness;
                if ($collapseActive) {
                    $reproduceProb *= (float) config('worldos.intelligence.ecological_collapse_reproduction_factor', 0.4);
                }
                $rng = new SimulationRng((int) ($universe->seed ?? 0), $snapshotTick, ($actor->id ?? 0) + 200000);
                if ($rng->nextFloat() < $reproduceProb) {
                    $childTraits = $this->mutateVector($actor->traits ?? [], $mutationRate, new SimulationRng((int) ($universe->seed ?? 0), $snapshotTick, ($actor->id ?? 0) + 300000));
                    $childPhysic = $this->mutateVector($actor->metrics['physic'] ?? ActorEntity::defaultPhysicVector(), $mutationRate, new SimulationRng((int) ($universe->seed ?? 0), $snapshotTick, ($actor->id ?? 0) + 400000));
                    $childEnergy = $energy * $reproduceEnergyRatioChild;
                    $energy -= $reproduceCost;
                    $childMetrics = [
                            'physic' => $childPhysic,
                            'spawned_at_tick' => $snapshotTick,
                            'energy' => $childEnergy,
                            'max_energy' => $metrics['max_energy'] ?? $energyMaxDefault,
                            'metabolism' => $metrics['metabolism'] ?? $metabolismBase,
                        ];
                        $childCulture = $this->inheritCultureWithMutation(
                            $actor->metrics['culture'] ?? null,
                            $mutationRate,
                            new SimulationRng((int) ($universe->seed ?? 0), $snapshotTick, ($actor->id ?? 0) + 500000)
                        );
                        if ($childCulture !== null) {
                            $childMetrics['culture'] = $childCulture;
                        }
                        $child = $this->spawnActorAction->handle([
                            'universe_id' => $universe->id,
                            'name' => $actor->name . ' Jr.',
                            'archetype' => $actor->archetype,
                            'traits' => $childTraits,
                            'metrics' => $childMetrics,
                            'generation' => ($actor->generation ?? 1) + 1,
                        ]);
                    Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) reproduced in Universe {$universe->id}, child {$child->name}.");
                }
            }

            $metrics['energy'] = $energy;
            $metrics['starving'] = $energy < $starvationThreshold;
            $metrics['species_id'] = $this->evolutionPressure->speciesId($actor->traits ?? [], $actor->metrics['physic'] ?? null);

            if ($energy <= 0) {
                $actor->isAlive = false;
                Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) starved (energy <= 0) in Universe {$universe->id}.");
            }

            $actor->metrics = $metrics;
            $this->actorRepository->save($actor);
        }

        // Resource regeneration (per-zone; biome factor from Ecological Phase Transition)
        if (!empty($zones) && $resourceRegenRate > 0) {
            foreach ($zones as &$zone) {
                if (!isset($zone['state'])) {
                    $zone['state'] = [];
                }
                $foodKey = array_key_exists('food', $zone['state']) ? 'food' : 'resources';
                $current = (float) ($zone['state'][$foodKey] ?? 0);
                $biomeFactor = \App\Services\Simulation\EcologicalPhaseTransitionEngine::resourceRegenFactorForZone($zone['state']);
                $zone['state'][$foodKey] = $current + $resourceRegenRate * $ticks * $biomeFactor;
                $zonesModified = true;
            }
        }

        if ($zonesModified) {
            $stateVector['zones'] = $zones;
            $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        }
    }

    private function getZonesFromUniverse(Universe $universe): array
    {
        $stateVector = $universe->state_vector;
        if (is_string($stateVector)) {
            $stateVector = json_decode($stateVector, true) ?? [];
        }
        $zones = $stateVector['zones'] ?? [];
        return is_array($zones) ? $zones : [];
    }

    /**
     * Ensure energy, max_energy, metabolism in metrics (backward compat).
     * Metabolism from physic: body_size proxy (avg physic) * 0.3 + strength * 0.2 + stamina * 0.1.
     */
    private function ensureEnergyMetrics(
        array $metrics,
        array $traits,
        ?array $physic,
        float $energyMaxDefault,
        float $metabolismBase
    ): array {
        if (!isset($metrics['max_energy']) || $metrics['max_energy'] <= 0) {
            $metrics['max_energy'] = $energyMaxDefault;
        }
        if (!array_key_exists('energy', $metrics) || $metrics['energy'] === null) {
            $metrics['energy'] = (float) ($metrics['max_energy'] ?? $energyMaxDefault);
        }
        if (!isset($metrics['metabolism'])) {
            $physicAggregate = 0.5;
            if ($physic !== null && $physic !== []) {
                $vals = array_values($physic);
                $n = 0;
                $sum = 0;
                foreach ($vals as $v) {
                    if (is_numeric($v)) {
                        $sum += max(0, min(1, (float) $v));
                        $n++;
                    }
                }
                $physicAggregate = $n > 0 ? $sum / $n : 0.5;
            }
            $strength = (float) ($physic[2] ?? $physic['Strength'] ?? $physicAggregate);
            $stamina = (float) ($physic[1] ?? $physic['Stamina'] ?? $physicAggregate);
            $metrics['metabolism'] = $metabolismBase * (0.6 + 0.2 * $physicAggregate + 0.1 * $strength + 0.1 * $stamina);
        }
        return $metrics;
    }

    /**
     * Mutate a vector (traits or physic) for reproduction. Each dimension gets +/- mutationRate (deterministic RNG).
     */
    private function mutateVector(array $vector, float $mutationRate, SimulationRng $rng): array
    {
        $out = [];
        foreach ($vector as $key => $val) {
            $v = is_numeric($val) ? (float) $val : 0.5;
            $delta = ($rng->nextFloat() * 2 - 1) * $mutationRate;
            $out[$key] = max(0, min(1, $v + $delta));
        }
        return $out;
    }

    /**
     * Inherit culture from parent with mutation (Tier 7 Culture Engine parent–child transmission).
     */
    private function inheritCultureWithMutation(?array $parentCulture, float $mutationRate, SimulationRng $rng): ?array
    {
        $dims = \App\Modules\Intelligence\Services\CultureEngine::MEME_DIMENSIONS;
        if (!is_array($parentCulture) || empty($parentCulture)) {
            return null;
        }
        $out = [];
        foreach ($dims as $d) {
            $v = max(0.0, min(1.0, (float) ($parentCulture[$d] ?? 0.5)));
            $delta = ($rng->nextFloat() * 2 - 1) * $mutationRate;
            $out[$d] = max(0.0, min(1.0, $v + $delta));
        }
        return $out;
    }
}
