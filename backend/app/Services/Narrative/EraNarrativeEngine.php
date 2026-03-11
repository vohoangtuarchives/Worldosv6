<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Era;
use App\Models\HistoricalFact;
use App\Models\Universe;

/**
 * Generates era summary narrative from template + STRICT FACTS. Used by ProcessNarrativeJob (engine=era).
 */
class EraNarrativeEngine
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
     * Generate summary for an era and update Era model. Returns true if summary was set.
     */
    public function generateForEra(Era $era): bool
    {
        $universe = $era->universe;
        if (!$universe) {
            return false;
        }

        $chronicles = Chronicle::where('universe_id', $era->universe_id)
            ->where(function ($q) use ($era) {
                $q->whereBetween('from_tick', [$era->start_tick, $era->end_tick])
                    ->orWhereBetween('to_tick', [$era->start_tick, $era->end_tick]);
            })
            ->limit(200)
            ->get();

        $facts = HistoricalFact::where('universe_id', $era->universe_id)
            ->whereBetween('tick', [$era->start_tick, $era->end_tick])
            ->get();

        $civilizations = [];
        $wars = [];
        $anomalies = [];
        $climate = [];
        $factsList = [];

        foreach ($chronicles as $c) {
            $action = $c->raw_payload['action'] ?? null;
            if ($action === 'war_started' || $action === 'war_ended') {
                $wars[] = "Tick {$c->from_tick}: {$action}";
            }
            if ($action === 'anomaly_spawned') {
                $anomalies[] = "Tick {$c->from_tick}: " . ($c->raw_payload['anomaly_type'] ?? 'anomaly');
            }
        }

        foreach ($facts as $f) {
            $factsList[] = "Tick {$f->tick}: {$f->category} - " . json_encode($f->metrics_after ?? []);
        }

        $payload = [
            'civilizations' => implode(', ', $civilizations) ?: 'None recorded',
            'wars' => implode('; ', array_slice($wars, 0, 10)) ?: 'None',
            'anomalies' => implode('; ', array_slice($anomalies, 0, 10)) ?: 'None',
            'climate' => implode('; ', array_slice($climate, 0, 5)) ?: 'Unknown',
            'facts' => implode("\n", array_slice($factsList, 0, 30)),
        ];

        $template = config('worldos.narrative.prompt_templates.era', 'Era {start_tick}-{end_tick}. STRICT FACTS:\n{facts}\n\nWrite a short historical paragraph.');
        $prompt = str_replace(array_keys($payload), array_values($payload), $template);
        $prompt = str_replace(['{start_tick}', '{end_tick}'], [(string) $era->start_tick, (string) $era->end_tick], $prompt);

        $cacheKey = null;
        if ($this->cache !== null) {
            $cacheKey = 'era:' . $era->id . ':' . hash('sha256', $prompt);
            $cached = $this->cache->get($cacheKey);
            if ($cached !== null) {
                $era->update(['summary' => $cached]);
                return true;
            }
        }

        $content = $this->generator->generate($prompt);
        if ($content) {
            $this->cache?->put($cacheKey ?? ('era:' . $era->id . ':' . hash('sha256', $content)), $content);
            $era->update(['summary' => $content]);
            return true;
        }

        return false;
    }
}
