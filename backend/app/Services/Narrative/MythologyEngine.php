<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Myth;

/**
 * Turns myth-worthy events (anomaly, miracle, transmigration, paradox) into Myth records.
 * Uses MYTH_PROMPT_TEMPLATE + STRICT FACTS; creates myths table row and optionally Chronicle type myth.
 */
class MythologyEngine
{
    protected const MYTH_WORTHY_TYPES = ['anomaly', 'miracle', 'transmigration', 'paradox', 'myth', 'institution_collapse', 'civilization_collapse'];

    public function __construct(
        protected NarrativeGenerator $generator,
        protected ?NarrativeCache $cache = null,
        protected ?ReligionSeedDetector $religionSeedDetector = null,
        protected ?NarrativeScheduler $narrativeScheduler = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
        if ($this->religionSeedDetector === null && app()->bound(ReligionSeedDetector::class)) {
            $this->religionSeedDetector = app(ReligionSeedDetector::class);
        }
        if ($this->narrativeScheduler === null && app()->bound(NarrativeScheduler::class)) {
            $this->narrativeScheduler = app(NarrativeScheduler::class);
        }
    }

    /**
     * Generate a myth from the given chronicles and store in myths table.
     *
     * @param  array{universe_id: int, chronicle_ids?: int[], start_tick?: int, end_tick?: int, myth_type?: string}  $payload
     */
    public function generateFromPayload(array $payload): ?Myth
    {
        $universeId = (int) ($payload['universe_id'] ?? 0);
        if ($universeId <= 0) {
            return null;
        }

        $chronicles = $this->resolveChronicles($universeId, $payload);
        if ($chronicles->isEmpty()) {
            return null;
        }

        $mythType = $payload['myth_type'] ?? 'legend';
        if (!in_array($mythType, ['legend', 'religion', 'prophecy'], true)) {
            $mythType = 'legend';
        }

        $eventsSummary = [];
        $factsList = [];
        foreach ($chronicles as $c) {
            $raw = $c->raw_payload ?? [];
            $desc = is_array($raw) ? ($raw['description'] ?? json_encode($raw)) : (string) $raw;
            $eventsSummary[] = "Tick {$c->from_tick}-{$c->to_tick} [{$c->type}]: {$desc}";
            $factsList[] = "Tick {$c->from_tick}-{$c->to_tick}: {$c->type} - {$desc}";
        }
        $eventsBlock = implode("\n", array_slice($eventsSummary, 0, 30));
        $factsBlock = implode("\n", array_slice($factsList, 0, 30));

        $template = config('worldos.narrative.prompt_templates.myth', "Source events: {events}\n\nSTRICT FACTS:\n{facts}\n\nTurn these into a short myth/legend without contradicting the facts.");
        $prompt = str_replace(
            ['{events}', '{facts}'],
            [$eventsBlock, $factsBlock],
            $template
        );

        $cacheKey = 'myth:' . $universeId . ':' . $mythType . ':' . hash('sha256', $prompt);
        $story = $this->cache?->get($cacheKey);
        if ($story === null) {
            $story = $this->generator->generate($prompt);
            if ($story) {
                $this->cache?->put($cacheKey, $story);
            }
        }
        if (!$story) {
            return null;
        }

        $impact = $this->computeImpact($chronicles);
        $firstChronicle = $chronicles->first();

        $myth = Myth::create([
            'universe_id' => $universeId,
            'chronicle_id' => $firstChronicle->id,
            'myth_type' => $mythType,
            'story' => $story,
            'source_events' => $chronicles->pluck('id')->values()->all(),
            'impact' => $impact,
        ]);

        if ($this->religionSeedDetector?->isReligionSeed($myth) && $this->narrativeScheduler) {
            $this->narrativeScheduler->scheduleReligion($universeId, $myth->id);
        }

        return $myth;
    }

    protected function resolveChronicles(int $universeId, array $payload): \Illuminate\Support\Collection
    {
        $chronicleIds = $payload['chronicle_ids'] ?? null;
        if (is_array($chronicleIds) && !empty($chronicleIds)) {
            $chronicles = Chronicle::where('universe_id', $universeId)
                ->whereIn('id', $chronicleIds)
                ->orderBy('from_tick')
                ->get();
        } else {
            $startTick = (int) ($payload['start_tick'] ?? 0);
            $endTick = (int) ($payload['end_tick'] ?? $startTick + 100);
            if ($endTick <= $startTick) {
                return collect();
            }
            $chronicles = Chronicle::where('universe_id', $universeId)
                ->whereBetween('from_tick', [$startTick, $endTick])
                ->orderBy('from_tick')
                ->limit(50)
                ->get();
        }

        return $chronicles->filter(function (Chronicle $c) {
            $type = strtolower((string) $c->type);
            foreach (self::MYTH_WORTHY_TYPES as $worthy) {
                if (str_contains($type, $worthy)) {
                    return true;
                }
            }
            $importance = (float) ($c->importance ?? 0);
            return $importance >= 0.5;
        })->values();
    }

    protected function computeImpact(\Illuminate\Support\Collection $chronicles): float
    {
        $sum = 0.0;
        $n = 0;
        foreach ($chronicles as $c) {
            $sum += (float) ($c->importance ?? 0.3);
            $n++;
        }
        return $n > 0 ? min(1.0, $sum / $n + 0.2) : 0.3;
    }
}
