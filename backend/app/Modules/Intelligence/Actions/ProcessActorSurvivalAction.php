<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class ProcessActorSurvivalAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository,
        private \App\Modules\Intelligence\Services\ActorTransitionSystem $transitionSystem,
        private \App\Modules\Intelligence\Services\EvolutionPressureService $evolutionPressure
    ) {}

    public function handle(Universe $universe, array $simulationResponse): void
    {
        $actors = $this->actorRepository->findByUniverse($universe->id);
        $snapshot = $simulationResponse['snapshot'] ?? null;
        $entropy = $snapshot !== null && isset($snapshot['entropy'])
            ? (float) $snapshot['entropy']
            : 0.5;
        $ticks = max(1, (int) ($simulationResponse['_ticks'] ?? 1));
        $snapshotTick = $snapshot !== null && isset($snapshot['tick'])
            ? (int) $snapshot['tick']
            : (int) ($universe->current_tick ?? 0);

        $ticksPerYear = max(1, (int) config('worldos.intelligence.ticks_per_year', 1));
        $defaultMaxAgeYears = max(1, (int) config('worldos.intelligence.default_max_age_years', 150));

        if (count($actors) === 0) {
            Log::info("Intelligence: ProcessActorSurvivalAction skipped for Universe {$universe->id} (tick {$snapshotTick}): no actors in universe.");
            return;
        }

        $pressure = $this->evolutionPressure->fromUniverse($universe);
        $deathCount = 0;
        $actorIndex = 0;

        $stateVector = is_array($universe->state_vector) ? $universe->state_vector : [];
        $ecologicalCollapse = $stateVector['ecological_collapse'] ?? null;
        $collapseActive = is_array($ecologicalCollapse) && !empty($ecologicalCollapse['active'])
            && $snapshotTick <= (int) ($ecologicalCollapse['until_tick'] ?? PHP_INT_MAX);
        $collapseDeathProbAdd = $collapseActive
            ? (float) config('worldos.intelligence.ecological_collapse_death_probability_add', 0.1)
            : 0.0;

        foreach ($actors as $actor) {
            if (!$actor->isAlive) {
                $actorIndex++;
                continue;
            }

            $oldState = $actor->isAlive;

            // ActorBio: life_expectancy from genome (Longevity), ensure in metrics
            $actor->metrics = \App\Modules\Intelligence\Entities\ActorEntity::ensureLifeExpectancyInMetrics(
                $actor->metrics ?? [],
                $actor->traits ?? [],
                $defaultMaxAgeYears
            );
            $lifeExpectancy = (float) ($actor->metrics['life_expectancy'] ?? $defaultMaxAgeYears);

            // Tuổi thọ: so sánh tuổi (năm) với max theo Longevity.
            $spawnedAtTick = isset($actor->metrics['spawned_at_tick']) ? (int) $actor->metrics['spawned_at_tick'] : 0;
            $ageTicks = max(0, $snapshotTick - $spawnedAtTick);
            $ageYears = $ageTicks / $ticksPerYear;

            if ($lifeExpectancy <= 0) {
                $lifeExpectancy = (float) $defaultMaxAgeYears;
            }
            if ($ageYears >= $lifeExpectancy) {
                $actor->fromState($actor->toState()->with(['isAlive' => false]));
                if ($oldState) {
                    $deathCount++;
                    Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) perished in Universe {$universe->id} at tick {$snapshotTick} (age {$ageYears} yrs >= life_expectancy {$lifeExpectancy}).");
                }
                $this->actorRepository->save($actor);
                $actorIndex++;
                continue;
            }

            $ageRatio = $lifeExpectancy > 0 ? ($ageYears / $lifeExpectancy) : 0.0;

            $fitness = $this->evolutionPressure->fitness(
                $actor->traits ?? [],
                $actor->metrics['physic'] ?? null,
                $pressure
            );

            for ($t = 0; $t < $ticks && $actor->isAlive; $t++) {
                $tickForRng = $snapshotTick - $ticks + $t;
                $rngSalt = ($actor->id ?? 0) + ($actorIndex * 100000);
                $rng = new \App\Modules\Intelligence\Domain\Rng\SimulationRng(
                    (int) ($universe->seed ?? 0),
                    $tickForRng,
                    $rngSalt
                );
                $state = $actor->toState();
                $state = $this->transitionSystem->processSurvival($state, $entropy, $rng, $ageRatio, $fitness, $collapseDeathProbAdd);
                $actor->fromState($state);
            }

            if ($oldState && !$actor->isAlive) {
                $deathCount++;
                Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) has perished in Universe {$universe->id} at tick {$universe->current_tick}.");
            }

            $this->actorRepository->save($actor);
            $actorIndex++;
        }

        Log::info("Intelligence: ProcessActorSurvivalAction Universe {$universe->id} tick {$snapshotTick}: actors=" . count($actors) . " entropy={$entropy} ticks={$ticks} deaths={$deathCount}.");

        if ($deathCount > 0) {
            Log::info("Intelligence: Processed survival for Universe {$universe->id}. Deaths: $deathCount.");
        }
    }
}
