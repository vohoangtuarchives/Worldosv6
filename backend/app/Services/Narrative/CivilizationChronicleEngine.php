<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Civilization;
use App\Models\CivilizationHistory;
use App\Models\HistoricalFact;

/**
 * Generates origin_story, golden_age_story, collapse_story for a civilization from template + STRICT FACTS.
 * Used by ProcessNarrativeJob (engine=civilization).
 */
class CivilizationChronicleEngine
{
    public function __construct(
        protected NarrativeGenerator $generator,
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Generate all three stories for the civilization and save to civilizations_history.
     */
    public function generateForCivilization(Civilization $civilization): bool
    {
        $universeId = $civilization->universe_id;
        $startTick = (int) $civilization->origin_tick;
        $endTick = (int) ($civilization->collapse_tick ?? $civilization->origin_tick + 100);

        $chronicles = Chronicle::where('universe_id', $universeId)
            ->where(function ($q) use ($startTick, $endTick) {
                $q->whereBetween('from_tick', [$startTick, $endTick])
                    ->orWhereBetween('to_tick', [$startTick, $endTick]);
            })
            ->limit(300)
            ->get();

        $facts = HistoricalFact::where('universe_id', $universeId)
            ->whereBetween('tick', [$startTick, $endTick])
            ->where(function ($q) use ($civilization) {
                $q->where('civilization_id', $civilization->id)->orWhereNull('civilization_id');
            })
            ->get();

        $factsList = [];
        foreach ($facts as $f) {
            $factsList[] = "Tick {$f->tick}: {$f->category} - " . json_encode($f->metrics_after ?? []);
        }
        $factsBlock = implode("\n", array_slice($factsList, 0, 50));

        $template = config('worldos.narrative.prompt_templates.civilization', "Civilization: {name}. STRICT FACTS:\n{facts}\n\nWrite a short paragraph.");
        $basePayload = [
            'name' => $civilization->name,
            'origin_tick' => (string) $civilization->origin_tick,
            'collapse_tick' => (string) ($civilization->collapse_tick ?? 'ongoing'),
            'facts' => $factsBlock,
        ];

        $history = CivilizationHistory::firstOrCreate(
            ['civilization_id' => $civilization->id],
            ['origin_story' => null, 'golden_age_story' => null, 'collapse_story' => null]
        );

        $stories = ['origin_story', 'golden_age_story', 'collapse_story'];
        $prompts = [
            'origin_story' => str_replace(array_keys($basePayload), array_values($basePayload), $template . "\nFocus: origin and founding of this civilization."),
            'golden_age_story' => str_replace(array_keys($basePayload), array_values($basePayload), $template . "\nFocus: golden age and peak of this civilization."),
            'collapse_story' => str_replace(array_keys($basePayload), array_values($basePayload), $template . "\nFocus: collapse and end of this civilization."),
        ];

        $updated = false;
        foreach ($stories as $key) {
            $prompt = $prompts[$key];
            $cacheKey = 'civ:' . $civilization->id . ':' . $key . ':' . hash('sha256', $prompt);
            $content = $this->cache?->get($cacheKey);
            if ($content === null) {
                $content = $this->generator->generate($prompt);
                if ($content) {
                    $this->cache?->put($cacheKey, $content);
                }
            }
            if ($content) {
                $history->update([$key => $content]);
                $updated = true;
            }
        }

        return $updated;
    }
}
