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

    public function runWithState(\App\Modules\Simulation\Core\Runtime\State\WorldState $state, array $simulationResponse): void
    {
        $actors = $state->getActorEntities();
        if (empty($actors)) return;

        $universeId = (int) $state->get('universe_id');
        $seed = (int) $state->get('seed', 0);
        $ticks = max(1, (int) ($simulationResponse['_ticks'] ?? 1));

        $metabolismBase = (float) config('worldos.intelligence.metabolism_base', 0.5);
        $energyMaxDefault = (float) config('worldos.intelligence.energy_max_default', 200);
        $starvationThreshold = (float) config('worldos.intelligence.starvation_threshold', 20);
        $gatherRate = (float) config('worldos.intelligence.gather_rate', 5);
        $resourceRegenRate = (float) config('worldos.intelligence.resource_regen_rate', 2);
        $reproduceCost = (float) config('worldos.intelligence.reproduce_cost', 80);
        $reproduceEnergyRatioChild = (float) config('worldos.intelligence.reproduce_energy_ratio_child', 0.3);
        $mutationRate = (float) config('worldos.intelligence.mutation_rate', 0.05);
        $snapshotTick = (int) (($simulationResponse['snapshot'] ?? [])['tick'] ?? $state->get('tick', 0));
        $zones = $state->get('zones', []);

        // 0. Auto-Spawn Initial Agents if empty
        if (count($actors) < 30) {
            $actors = $this->spawnInitialAgents($state, $universeId, 30 - count($actors), $zones);
        }
        $pressure = $state->get('ecosystem.pressure', []);
        if (empty($pressure)) {
            $pressure = $this->evolutionPressure->fromUniverseId($universeId);
        }

        $ecologicalCollapse = $state->get('ecological_collapse', []);
        $collapseActive = is_array($ecologicalCollapse) && !empty($ecologicalCollapse['active'])
            && $snapshotTick <= (int) ($ecologicalCollapse['until_tick'] ?? PHP_INT_MAX);
            
        if ($collapseActive && $resourceRegenRate > 0) {
            $resourceRegenRate *= (float) config('worldos.intelligence.ecological_collapse_resource_regeneration_factor', 0.5);
        }

        $newActors = [];

        foreach ($actors as $actor) {
            if (!$actor->isAlive) continue;

            // 1. Persistent Zone Binding
            if ($actor->zone_id === null && !empty($zones)) {
                $actor->zone_id = abs($actor->id ?? 0) % count($zones);
            }

            $metrics = $actor->metrics ?? [];
            $metrics = $this->ensureEnergyMetrics($metrics, $actor->traits ?? [], $actor->metrics['physic'] ?? null, $energyMaxDefault, $metabolismBase);

            // 2. Hunger Increase (amplified by zone resource_stress)
            $hunger = (float) ($actor->hunger ?? 0.5);
            
            // V10: Zone resource pressure amplifies hunger
            $zoneStress = 0.0;
            if ($actor->zone_id !== null && !empty($zones)) {
                $zoneIndex = abs($actor->zone_id) % count($zones);
                $zoneStress = (float) ($zones[$zoneIndex]['state']['resource_stress'] ?? 0);
            }
            $hungerGrowthRate = 0.05 + ($zoneStress * 0.08); // High stress zone = hunger 2.6x faster
            $hunger += $hungerGrowthRate * $ticks;
            
            // 3. Search Food (Real Resource Depletion)
            if ($hunger > 0.6 && !empty($zones)) {
                $zoneIndex = $actor->zone_id % count($zones);
                $zone = &$zones[$zoneIndex];
                $foodKey = isset($zone['state']['food']) ? 'food' : (isset($zone['state']['resources']) ? 'resources' : 'resource');
                $available = (float) ($zone['state'][$foodKey] ?? 0);
                
                $searchAmount = 0.2 * $ticks;
                $gather = min($searchAmount, $available);
                
                if ($gather > 0) {
                    $hunger = max(0, $hunger - ($gather * 2.0));
                    $zone['state'][$foodKey] = max(0, $available - $gather);
                }
            }

            // 4. Energy Consumption (Metabolism)
            $metabolism = (float) ($metrics['metabolism'] ?? $metabolismBase);
            $energy = (float) ($metrics['energy'] ?? $energyMaxDefault);
            $maxEnergy = (float) ($metrics['max_energy'] ?? $energyMaxDefault);
            
            // If still very hungry, lose extra energy
            if ($hunger > 0.8) {
                $energy -= $metabolism * 2.0 * $ticks * (0.9 + mt_rand(0, 200) / 1000); // Starvation stress + randomness
            } else {
                $energy -= $metabolism * $ticks * (0.8 + mt_rand(0, 400) / 1000); // Normal metabolism + variance
            }

            $energy = max(0, min($maxEnergy, $energy));
            $actor->hunger = $hunger;
            $actor->energy = $energy; // Sync to property
            $metrics['hunger'] = $hunger; // Sync to metrics for persistence

            // Reproduction
            if ($energy > $reproduceCost) {
                $longevity = (float) ($actor->traits[17] ?? $actor->traits['Longevity'] ?? 0.5);
                $fitness = $this->evolutionPressure->fitness($actor->traits ?? [], $actor->metrics['physic'] ?? null, $pressure);
                $reproduceProb = 0.08 * max(0, min(1, $longevity)) * $fitness;
                if ($collapseActive) {
                    $reproduceProb *= (float) config('worldos.intelligence.ecological_collapse_reproduction_factor', 0.4);
                }
                $rng = new SimulationRng($seed, $snapshotTick, ($actor->id ?? 0) + 200000);
                if ($rng->nextFloat() < $reproduceProb) {
                    $childTraits = $this->mutateVector($actor->traits ?? [], $mutationRate, new SimulationRng($seed, $snapshotTick, ($actor->id ?? 0) + 300000));
                    $childPhysic = $this->mutateVector($actor->metrics['physic'] ?? ActorEntity::defaultPhysicVector(), $mutationRate, new SimulationRng($seed, $snapshotTick, ($actor->id ?? 0) + 400000));
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
                        new SimulationRng($seed, $snapshotTick, ($actor->id ?? 0) + 500000)
                    );
                    if ($childCulture !== null) $childMetrics['culture'] = $childCulture;
                    
                    $childEntity = $this->spawnActorAction->handle([
                        'universe_id' => $universeId,
                        'name' => $actor->name . ' Jr.',
                        'archetype' => $actor->archetype,
                        'traits' => $childTraits,
                        'metrics' => $childMetrics,
                        'generation' => ($actor->generation ?? 1) + 1,
                    ]);
                    $newActors[] = $childEntity;
                    Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) reproduced in Universe {$universeId}, child {$childEntity->name}.");
                }
            }

            $metrics['energy'] = $energy;
            $metrics['starving'] = $energy < $starvationThreshold;
            $metrics['species_id'] = $this->evolutionPressure->speciesId($actor->traits ?? [], $actor->metrics['physic'] ?? null);

            if ($energy <= 0) {
                $actor->isAlive = false;
                Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) starved to death in Universe {$universeId}.");
            }
            $actor->metrics = $metrics;
        }

        // Resource regeneration
        if (!empty($zones) && $resourceRegenRate > 0) {
            foreach ($zones as &$zone) {
                if (!isset($zone['state'])) $zone['state'] = [];
                $foodKey = array_key_exists('food', $zone['state']) ? 'food' : 'resources';
                $current = (float) ($zone['state'][$foodKey] ?? 0);
                $biomeFactor = \App\Modules\Simulation\Core\Engines\Biological\EcologicalPhaseTransitionEngine::resourceRegenFactorForZone($zone['state']);
                $zone['state'][$foodKey] = $current + $resourceRegenRate * $ticks * $biomeFactor;
            }
        }

        $state->set('zones', $zones);
        if (!empty($newActors)) {
            $state->setActorEntities(array_merge($state->getActorEntities(), $newActors));
        }
    }

    private function spawnInitialAgents(\App\Modules\Simulation\Core\Runtime\State\WorldState $state, int $universeId, int $count, array $zones): array
    {
        $actors = $state->getActorEntities();
        Log::info("Intelligence: Spawning $count initial agents for Universe $universeId");
        
        for ($i = 0; $i < $count; $i++) {
            $zoneId = !empty($zones) ? ($i % count($zones)) : null;
            $actor = $this->spawnActorAction->handle([
                'universe_id' => $universeId,
                'name' => "Colonist " . (count($actors) + 1),
                'archetype' => 'pioneer',
                'generation' => 1,
                'metrics' => [
                    'energy' => mt_rand(70, 100),
                    'hunger' => mt_rand(10, 30) / 100,
                    'zone_id' => $zoneId
                ]
            ]);
            $actors[] = $actor;
        }
        
        $state->setActorEntities($actors);
        return $actors;
    }

    public function handle(Universe $universe, array $simulationResponse): void
    {
        // Deprecated
    }

    private function getZonesFromState(\App\Modules\Simulation\Core\Runtime\State\WorldState $state): array
    {
        return $state->get('zones', []);
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


