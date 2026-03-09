<?php

namespace App\Modules\Intelligence\Services;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Behavior & Decision Engine (Tier 6).
 * Needs (hunger, safety, reproduction, social), goal from needs, Utility AI (score actions),
 * execution state (idle, eating, fleeing, mating, exploring). Personality from traits.
 * Stagger tick (actor_id % N === tick % N) for performance.
 */
class ActorBehaviorEngine
{
    public const NEED_HUNGER = 'hunger';
    public const NEED_SAFETY = 'safety';
    public const NEED_REPRODUCTION = 'reproduction';
    public const NEED_SOCIAL = 'social';

    public const ACTION_IDLE = 'idle';
    public const ACTION_EAT = 'eating';
    public const ACTION_FLEE = 'fleeing';
    public const ACTION_MATE = 'mating';
    public const ACTION_EXPLORE = 'exploring';

    public function __construct(
        protected ActorRepositoryInterface $actorRepository,
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    /**
     * Run behavior decision for actors this tick. Call after ProcessActorSurvival.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.behavior_tick_interval', 1);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $actors = $this->actorRepository->findByUniverse($universe->id);
        $alive = array_filter($actors, fn($a) => $a->isAlive);
        if (empty($alive)) {
            return;
        }

        $stagger = max(1, (int) config('worldos.intelligence.behavior_stagger_modulus', 3));
        $stateVector = $this->getStateVector($universe);
        $collapseActive = $this->isCollapseActive($stateVector, $currentTick);
        $seed = (int) ($universe->seed ?? 0) + $universe->id * 31;
        $saved = 0;

        foreach ($alive as $actor) {
            if (($actor->id ?? 0) % $stagger !== $currentTick % $stagger) {
                continue;
            }
            $this->decideAndApply($actor, $universe, $currentTick, $collapseActive, $seed);
            $this->actorRepository->save($actor);
            $saved++;
        }

        if ($saved > 0) {
            Log::debug("ActorBehaviorEngine: Universe {$universe->id} tick {$currentTick}, {$saved} actors updated");
        }
    }

    private function decideAndApply(
        ActorEntity $actor,
        Universe $universe,
        int $tick,
        bool $collapseActive,
        int $seed
    ): void {
        $traits = $actor->traits ?? [];
        $metrics = $actor->metrics ?? [];
        $energy = (float) ($metrics['energy'] ?? 100);
        $maxEnergy = (float) ($metrics['max_energy'] ?? 200);
        $starving = !empty($metrics['starving']);

        $needs = $this->computeNeeds($actor, $energy, $maxEnergy, $starving, $collapseActive);
        $goal = $this->dominantNeed($needs);
        $personality = $this->personalityFromTraits($traits);
        $culture = CultureEngine::getCultureForActor($metrics);
        $scores = $this->scoreActions($needs, $goal, $personality, $energy, $maxEnergy, $culture, $seed, $actor->id ?? 0, $tick);
        $action = $this->selectAction($scores, $seed, $actor->id ?? 0, $tick);

        $metrics['behavior_state'] = $action;
        $metrics['current_goal'] = $goal;
        $metrics['needs'] = $needs;
        $metrics['last_behavior_tick'] = $tick;
        $actor->metrics = $metrics;
    }

    private function computeNeeds(
        ActorEntity $actor,
        float $energy,
        float $maxEnergy,
        bool $starving,
        bool $collapseActive
    ): array {
        $traits = $actor->traits ?? [];
        $longevity = (float) ($traits[17] ?? $traits['Longevity'] ?? 0.5);
        $solidarity = (float) ($traits[5] ?? $traits['Solidarity'] ?? 0.5);

        $energyRatio = $maxEnergy > 0 ? $energy / $maxEnergy : 0.5;
        $hunger = $starving ? 1.0 : (1.0 - $energyRatio);
        $hunger = max(0.0, min(1.0, $hunger));

        $safety = $collapseActive ? 0.3 : 0.7;
        $safety = max(0.0, min(1.0, $safety));

        $reproduction = $energyRatio > 0.5 ? (1.0 - $longevity) * 0.5 + 0.3 : 0.2;
        $reproduction = max(0.0, min(1.0, $reproduction));

        $social = 1.0 - $solidarity;
        $social = max(0.0, min(1.0, $social));

        return [
            self::NEED_HUNGER => $hunger,
            self::NEED_SAFETY => $safety,
            self::NEED_REPRODUCTION => $reproduction,
            self::NEED_SOCIAL => $social,
        ];
    }

    private function dominantNeed(array $needs): string
    {
        $max = -1.0;
        $goal = self::NEED_HUNGER;
        foreach ($needs as $need => $value) {
            if ($value > $max) {
                $max = $value;
                $goal = $need;
            }
        }
        return $goal;
    }

    /**
     * @return array{aggression: float, curiosity: float, cooperation: float, fear: float}
     */
    private function personalityFromTraits(array $traits): array
    {
        $dominance = (float) ($traits[0] ?? $traits['Dominance'] ?? 0.5);
        $coercion = (float) ($traits[2] ?? $traits['Coercion'] ?? 0.5);
        $empathy = (float) ($traits[4] ?? $traits['Empathy'] ?? 0.5);
        $solidarity = (float) ($traits[5] ?? $traits['Solidarity'] ?? 0.5);
        $curiosity = (float) ($traits[8] ?? $traits['Curiosity'] ?? 0.5);
        $fear = (float) ($traits[11] ?? $traits['Fear'] ?? 0.5);

        return [
            'aggression' => ($dominance + $coercion) / 2,
            'curiosity' => $curiosity,
            'cooperation' => ($solidarity + $empathy) / 2,
            'fear' => $fear,
        ];
    }

    /**
     * @return array<string, float> action => score
     */
    private function scoreActions(
        array $needs,
        string $goal,
        array $personality,
        float $energy,
        float $maxEnergy,
        array $culture,
        int $seed,
        int $actorId,
        int $tick
    ): array {
        $scores = [
            self::ACTION_IDLE => 0.1,
            self::ACTION_EAT => 0.0,
            self::ACTION_FLEE => 0.0,
            self::ACTION_MATE => 0.0,
            self::ACTION_EXPLORE => 0.0,
        ];

        $hunger = $needs[self::NEED_HUNGER] ?? 0;
        $safety = $needs[self::NEED_SAFETY] ?? 0.5;
        $reproduction = $needs[self::NEED_REPRODUCTION] ?? 0;
        $social = $needs[self::NEED_SOCIAL] ?? 0.5;

        $scores[self::ACTION_EAT] = $hunger * 1.2 + ($goal === self::NEED_HUNGER ? 0.4 : 0);
        if ($energy >= $maxEnergy * 0.9) {
            $scores[self::ACTION_EAT] *= 0.2;
        }

        $scores[self::ACTION_FLEE] = (1.0 - $safety) * $personality['fear'] + ($goal === self::NEED_SAFETY ? 0.3 : 0);

        $scores[self::ACTION_MATE] = $reproduction * 0.8 + ($goal === self::NEED_REPRODUCTION ? 0.3 : 0);
        if ($energy < $maxEnergy * 0.4) {
            $scores[self::ACTION_MATE] *= 0.3;
        }

        $scores[self::ACTION_EXPLORE] = $personality['curiosity'] * 0.5 + ($goal === self::NEED_SOCIAL ? 0.2 : 0);

        $cultureWeight = (float) config('worldos.intelligence.culture_weight_in_behavior', 0.2);
        if ($cultureWeight > 0 && !empty($culture)) {
            $survival = (float) ($culture[CultureEngine::MEME_SURVIVAL] ?? 0.5);
            $socialM = (float) ($culture[CultureEngine::MEME_SOCIAL] ?? 0.5);
            $ritual = (float) ($culture[CultureEngine::MEME_RITUAL] ?? 0.5);
            $technology = (float) ($culture[CultureEngine::MEME_TECHNOLOGY] ?? 0.5);
            $scores[self::ACTION_EAT] += $cultureWeight * $survival * 0.3;
            $scores[self::ACTION_MATE] += $cultureWeight * $socialM * 0.25;
            $scores[self::ACTION_EXPLORE] += $cultureWeight * ($ritual + $technology) * 0.25;
        }

        return $scores;
    }

    private function selectAction(array $scores, int $seed, int $actorId, int $tick): string
    {
        $best = self::ACTION_IDLE;
        $bestScore = -1.0;
        foreach ($scores as $action => $score) {
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $action;
            }
        }
        return $best;
    }

    private function isCollapseActive(array $stateVector, int $tick): bool
    {
        $collapse = $stateVector['ecological_collapse'] ?? [];
        if (!is_array($collapse) || empty($collapse['active'])) {
            return false;
        }
        $until = (int) ($collapse['until_tick'] ?? 0);
        return $tick <= $until;
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
