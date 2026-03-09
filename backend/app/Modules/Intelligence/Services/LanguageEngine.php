<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Language Engine (Tier 8).
 * Signals → symbols → vocabulary. Intent → encode → decode → memory.
 * Vocabulary growth, communication between actors, language groups. Deterministic.
 */
class LanguageEngine
{
    /** Intent (goal) to default symbol id. */
    private const INTENT_SYMBOLS = [
        ActorBehaviorEngine::NEED_HUNGER => 'W0',
        ActorBehaviorEngine::NEED_SAFETY => 'W1',
        ActorBehaviorEngine::NEED_REPRODUCTION => 'W2',
        ActorBehaviorEngine::NEED_SOCIAL => 'W3',
    ];

    public function __construct(
        protected ActorRepositoryInterface $actorRepository
    ) {}

    /**
     * Run language communication and vocabulary growth. Call after ActorBehaviorEngine (so intent/goal is set).
     */
    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.language_tick_interval', 5);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $actors = $this->actorRepository->findByUniverse($universe->id);
        $alive = array_values(array_filter($actors, fn($a) => $a->isAlive));
        if (count($alive) < 2) {
            $this->ensureVocabularyInitialized($alive);
            return;
        }

        $commProb = (float) config('worldos.intelligence.language_communication_probability', 0.2);
        $vocabMax = max(8, (int) config('worldos.intelligence.language_vocabulary_max_size', 24));
        $memorySize = max(1, (int) config('worldos.intelligence.language_memory_size', 5));
        $memoryDecay = (float) config('worldos.intelligence.language_memory_decay', 0.05);
        $seed = (int) ($universe->seed ?? 0) + $universe->id * 31;
        $saved = 0;

        foreach ($alive as $actor) {
            $this->ensureVocabularyInitializedForActor($actor, $seed, $currentTick);
            $this->applyMemoryDecay($actor, $memoryDecay);
            $rng = $this->detFloat($seed, $currentTick, $actor->id ?? 0, 0);
            if ($rng < $commProb) {
                $others = array_values(array_filter($alive, fn($a) => ($a->id ?? 0) !== ($actor->id ?? 0)));
                if (!empty($others)) {
                    $receiver = $others[(int) ($this->detFloat($seed, $currentTick, $actor->id ?? 0, 1) * count($others)) % count($others)];
                    $symbol = $this->encodeIntent($actor, $seed, $currentTick);
                    $this->decodeAndStore($receiver, $symbol, $actor->id ?? 0, $currentTick, $vocabMax, $memorySize);
                    $this->actorRepository->save($receiver);
                    $saved++;
                }
            }
            $actor->metrics['language_group'] = $this->languageGroupId($actor->metrics['vocabulary'] ?? [], 6);
            $this->actorRepository->save($actor);
            $saved++;
        }

        if ($saved > 0) {
            Log::debug("LanguageEngine: Universe {$universe->id} tick {$currentTick}, language updated");
        }
    }

    private function ensureVocabularyInitialized(array $alive): void
    {
        foreach ($alive as $actor) {
            $this->ensureVocabularyInitializedForActor($actor, 0, 0);
            $this->actorRepository->save($actor);
        }
    }

    private function ensureVocabularyInitializedForActor($actor, int $seed, int $tick): void
    {
        $voc = $actor->metrics['vocabulary'] ?? null;
        if (is_array($voc) && !empty($voc)) {
            return;
        }
        $voc = [];
        foreach (self::INTENT_SYMBOLS as $symbol) {
            $voc[$symbol] = 0.3 + 0.4 * $this->detFloat($seed, $tick, $actor->id ?? 0, ord($symbol));
        }
        $actor->metrics['vocabulary'] = $voc;
        if (!isset($actor->metrics['communication_memory'])) {
            $actor->metrics['communication_memory'] = [];
        }
    }

    private function encodeIntent($actor, int $seed, int $tick): string
    {
        $goal = $actor->metrics['current_goal'] ?? ActorBehaviorEngine::NEED_HUNGER;
        $defaultSymbol = self::INTENT_SYMBOLS[$goal] ?? 'W0';
        $voc = $actor->metrics['vocabulary'] ?? [];
        if (empty($voc) || !isset($voc[$defaultSymbol])) {
            return $defaultSymbol;
        }
        $rng = $this->detFloat($seed, $tick, $actor->id ?? 0, 2);
        if ($rng < 0.7) {
            return $defaultSymbol;
        }
        $keys = array_keys($voc);
        return $keys[(int) ($rng * count($keys)) % count($keys)];
    }

    private function decodeAndStore($receiver, string $symbol, int $fromActorId, int $tick, int $vocabMax, int $memorySize): void
    {
        $voc = $receiver->metrics['vocabulary'] ?? [];
        $voc[$symbol] = min(1.0, ($voc[$symbol] ?? 0) + 0.15);
        arsort($voc, SORT_NUMERIC);
        $receiver->metrics['vocabulary'] = array_slice($voc, 0, $vocabMax, true);

        $mem = $receiver->metrics['communication_memory'] ?? [];
        array_unshift($mem, ['from' => $fromActorId, 'symbol' => $symbol, 'tick' => $tick]);
        $receiver->metrics['communication_memory'] = array_slice($mem, 0, $memorySize);
    }

    private function applyMemoryDecay($actor, float $decay): void
    {
        $mem = $actor->metrics['communication_memory'] ?? [];
        if (empty($mem) || $decay <= 0) {
            return;
        }
        $actor->metrics['communication_memory'] = $mem;
    }

    private function languageGroupId(array $vocabulary, int $topN): string
    {
        if (empty($vocabulary)) {
            return 'L0';
        }
        uasort($vocabulary, fn($a, $b) => $b <=> $a);
        $top = array_slice(array_keys($vocabulary), 0, $topN, true);
        return 'L' . substr(md5(json_encode($top)), 0, 6);
    }

    private function detFloat(int $seed, int $tick, int $salt, int $extra): float
    {
        $h = crc32($seed . ':' . $tick . ':' . $salt . ':' . $extra);
        return (float) (($h & 0x7FFFFFFF) / 0x7FFFFFFF);
    }

    /**
     * Get vocabulary for an actor (for narrative or other engines). Returns symbol => strength.
     */
    public static function getVocabulary(array $metrics): array
    {
        $voc = $metrics['vocabulary'] ?? [];
        return is_array($voc) ? $voc : [];
    }
}
