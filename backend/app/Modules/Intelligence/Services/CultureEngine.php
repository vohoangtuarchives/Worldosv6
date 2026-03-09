<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Culture Engine (Tier 7).
 * Meme pool (survival, social, technology, ritual), transmission (peer, observation),
 * cultural selection (fitness), mutation/drift. Culture groups (shared memes → cohesion).
 * Feedback to behavior via culture_weight in decision score.
 */
class CultureEngine
{
    public const MEME_SURVIVAL = 'survival';
    public const MEME_SOCIAL = 'social';
    public const MEME_TECHNOLOGY = 'technology';
    public const MEME_RITUAL = 'ritual';

    public const MEME_DIMENSIONS = [self::MEME_SURVIVAL, self::MEME_SOCIAL, self::MEME_TECHNOLOGY, self::MEME_RITUAL];

    public function __construct(
        protected ActorRepositoryInterface $actorRepository,
        protected EvolutionPressureService $evolutionPressure
    ) {}

    /**
     * Run culture transmission and drift. Call before ActorBehaviorEngine so behavior can read culture.
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.culture_tick_interval', 10);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $actors = $this->actorRepository->findByUniverse($universe->id);
        $alive = array_values(array_filter($actors, fn($a) => $a->isAlive));
        if (count($alive) < 2) {
            $this->ensureCultureInitialized($alive, $universe, $currentTick);
            return;
        }

        $transmissionRate = (float) config('worldos.intelligence.culture_transmission_rate', 0.15);
        $mutationRate = (float) config('worldos.intelligence.culture_mutation_rate', 0.05);
        $seed = (int) ($universe->seed ?? 0) + $universe->id * 31;
        $pressure = $this->evolutionPressure->fromUniverse($universe);
        $saved = 0;

        foreach ($alive as $actor) {
            $this->ensureCultureInitializedForActor($actor, $universe, $currentTick);
            $fitness = $this->evolutionPressure->fitness(
                $actor->traits ?? [],
                $actor->metrics['physic'] ?? null,
                $pressure
            );
            $rng = $this->detFloat($seed, $currentTick, $actor->id ?? 0, 0);
            if ($rng < $transmissionRate) {
                $others = array_values(array_filter($alive, fn($a) => ($a->id ?? 0) !== ($actor->id ?? 0)));
                if (empty($others)) {
                    $this->applyDrift($actor, $mutationRate * 0.5, $seed, $currentTick);
                    $actor->metrics['culture_group'] = $this->cultureGroupId($actor->metrics['culture'] ?? []);
                    $this->actorRepository->save($actor);
                    $saved++;
                    continue;
                }
                $peer = $others[(int) ($this->detFloat($seed, $currentTick, $actor->id ?? 0, 1) * count($others)) % count($others)];
                $peerFitness = $this->evolutionPressure->fitness(
                    $peer->traits ?? [],
                    $peer->metrics['physic'] ?? null,
                    $pressure
                );
                if ($peerFitness >= $fitness * 0.8) {
                    $this->copyMemeWithMutation($actor, $peer, $mutationRate, $seed, $currentTick);
                }
            }
            $this->applyDrift($actor, $mutationRate * 0.5, $seed, $currentTick);
            $actor->metrics['culture_group'] = $this->cultureGroupId($actor->metrics['culture'] ?? []);
            $this->actorRepository->save($actor);
            $saved++;
        }

        if ($saved > 0) {
            Log::debug("CultureEngine: Universe {$universe->id} tick {$currentTick}, culture updated");
        }
    }

    private function ensureCultureInitialized(array $alive, Universe $universe, int $tick): void
    {
        foreach ($alive as $actor) {
            $this->ensureCultureInitializedForActor($actor, $universe, $tick);
            $this->actorRepository->save($actor);
        }
    }

    private function ensureCultureInitializedForActor($actor, Universe $universe, int $tick): void
    {
        $culture = $actor->metrics['culture'] ?? null;
        if (is_array($culture) && !empty($culture)) {
            return;
        }
        $traits = $actor->traits ?? [];
        $seed = (int) ($universe->seed ?? 0) + ($actor->id ?? 0) * 31;
        $culture = [
            self::MEME_SURVIVAL => 0.3 + 0.4 * ($traits[10] ?? 0.5),
            self::MEME_SOCIAL => 0.3 + 0.4 * (($traits[4] ?? 0.5) + ($traits[5] ?? 0.5)) / 2,
            self::MEME_TECHNOLOGY => 0.3 + 0.4 * ($traits[8] ?? 0.5),
            self::MEME_RITUAL => 0.3 + 0.4 * ($traits[9] ?? 0.5),
        ];
        $actor->metrics['culture'] = $culture;
    }

    private function copyMemeWithMutation($receiver, $donor, float $mutationRate, int $seed, int $tick): void
    {
        $dim = self::MEME_DIMENSIONS[(int) ($this->detFloat($seed, $tick, ($receiver->id ?? 0) + 100, 2) * count(self::MEME_DIMENSIONS)) % count(self::MEME_DIMENSIONS)];
        $receiverCulture = $receiver->metrics['culture'] ?? $this->defaultCulture();
        $donorCulture = $donor->metrics['culture'] ?? $this->defaultCulture();
        $value = (float) ($donorCulture[$dim] ?? 0.5);
        $delta = ($this->detFloat($seed, $tick, ($receiver->id ?? 0) + 200, 2) * 2 - 1) * $mutationRate;
        $receiverCulture[$dim] = max(0.0, min(1.0, $value + $delta));
        $receiver->metrics['culture'] = $receiverCulture;
    }

    private function applyDrift($actor, float $rate, int $seed, int $tick): void
    {
        $culture = $actor->metrics['culture'] ?? $this->defaultCulture();
        foreach (self::MEME_DIMENSIONS as $i => $dim) {
            $delta = ($this->detFloat($seed, $tick, ($actor->id ?? 0) + 300 + $i, 0) * 2 - 1) * $rate;
            $culture[$dim] = max(0.0, min(1.0, ($culture[$dim] ?? 0.5) + $delta));
        }
        $actor->metrics['culture'] = $culture;
    }

    private function cultureGroupId(array $culture): string
    {
        $bins = [];
        foreach (self::MEME_DIMENSIONS as $d) {
            $v = (float) ($culture[$d] ?? 0.5);
            $bins[] = (int) min(3, floor($v * 4));
        }
        return 'C' . substr(md5(json_encode($bins)), 0, 6);
    }

    private function defaultCulture(): array
    {
        return array_fill_keys(self::MEME_DIMENSIONS, 0.5);
    }

    private function detFloat(int $seed, int $tick, int $salt, int $extra): float
    {
        $h = crc32($seed . ':' . $tick . ':' . $salt . ':' . $extra);
        return (float) (($h & 0x7FFFFFFF) / 0x7FFFFFFF);
    }

    /**
     * Return culture vector for an actor (for Behavior Engine). Keys: survival, social, technology, ritual.
     */
    public static function getCultureForActor(array $metrics): array
    {
        $culture = $metrics['culture'] ?? null;
        if (!is_array($culture)) {
            return array_fill_keys(self::MEME_DIMENSIONS, 0.5);
        }
        $out = [];
        foreach (self::MEME_DIMENSIONS as $d) {
            $out[$d] = max(0.0, min(1.0, (float) ($culture[$d] ?? 0.5)));
        }
        return $out;
    }
}
