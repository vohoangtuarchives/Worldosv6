<?php

namespace App\Services\Narrative;

use App\Models\Prophecy;
use App\Models\Universe;

/**
 * Generates prophecy text from state summary via LLM; stores in prophecies table.
 */
class ProphecyGenerator
{
    protected int $predictionHorizon;

    public function __construct(
        protected FuturePredictor $predictor,
        protected NarrativeGenerator $generator,
        protected ?NarrativeCache $cache = null,
        ?int $predictionHorizon = null
    ) {
        $this->predictionHorizon = $predictionHorizon ?? (int) config('worldos.narrative.prophecy_horizon_ticks', 100);
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Generate a prophecy for the universe at the given tick; store and return Prophecy.
     */
    public function generateForUniverse(Universe $universe, int $tick, string $stateSummary): ?Prophecy
    {
        $prompt = "Current world state: {$stateSummary}\n\n"
            . "Write a short, cryptic prophecy (1-2 sentences) about what might happen in the near future. "
            . "Do not use specific names; keep it general and ominous.";

        $cacheKey = 'prophecy:' . $universe->id . ':' . $tick . ':' . hash('sha256', $prompt);
        $text = $this->cache?->get($cacheKey);
        if ($text === null) {
            $text = $this->generator->generate($prompt);
            if ($text) {
                $this->cache?->put($cacheKey, $text);
            }
        }
        if (!$text) {
            return null;
        }

        $predictionTick = $tick + $this->predictionHorizon;

        return Prophecy::create([
            'universe_id' => $universe->id,
            'created_tick' => $tick,
            'prediction_tick' => $predictionTick,
            'text' => $text,
            'confidence' => 0.5,
            'fulfilled' => false,
            'source_snapshot_metrics' => ['summary' => $stateSummary],
        ]);
    }
}
