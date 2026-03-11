<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Era;
use App\Models\Legend;
use App\Models\Religion;
use App\Models\Universe;
use App\Models\UniverseHistory;
use App\Models\CivilizationHistory;
use App\Models\Civilization;
use Illuminate\Support\Facades\Log;

/**
 * Aggregates chronicles, eras, civilizations_history, religions, legends for a universe
 * and generates "Complete History of Universe #X" via LLM. Saves to universe_histories.
 */
class UniverseHistoryGenerator
{
    public const MAX_CHRONICLES = 150;
    public const MAX_CONTEXT_CHARS = 40000;

    public function __construct(
        protected NarrativeGenerator $generator,
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Generate full history for universe and save to universe_histories. Optional tick range.
     */
    public function generate(Universe $universe, ?int $fromTick = null, ?int $toTick = null): ?UniverseHistory
    {
        $toTick = $toTick ?? (int) ($universe->current_tick ?? 0);
        $fromTick = $fromTick ?? 0;
        if ($toTick < $fromTick) {
            return null;
        }

        $context = $this->buildContext($universe->id, $fromTick, $toTick);
        if ($context === '') {
            Log::warning("UniverseHistoryGenerator: No context for universe {$universe->id}");
            return null;
        }

        $prompt = "You are the AI Historian. Below are STRICT FACTS from the simulation (chronicles, eras, civilizations, religions, legends). "
            . "Write a coherent, readable 'Complete History of Universe #{$universe->id}' in 2-4 paragraphs. Do not contradict the facts.\n\n"
            . $context;

        if (strlen($prompt) > self::MAX_CONTEXT_CHARS) {
            $prompt = substr($prompt, 0, self::MAX_CONTEXT_CHARS) . "\n\n[Context truncated.]";
        }

        $cacheKey = 'universe_history:' . $universe->id . ':' . $fromTick . ':' . $toTick . ':' . hash('sha256', $prompt);
        $fullText = $this->cache?->get($cacheKey);
        if ($fullText === null) {
            $fullText = $this->generator->generate($prompt);
            if ($fullText) {
                $this->cache?->put($cacheKey, $fullText);
            }
        }
        if (!$fullText) {
            return null;
        }

        return UniverseHistory::create([
            'universe_id' => $universe->id,
            'full_text' => $fullText,
            'from_tick' => $fromTick,
            'to_tick' => $toTick,
            'generated_at' => now(),
        ]);
    }

    protected function buildContext(int $universeId, int $fromTick, int $toTick): string
    {
        $parts = [];

        $chronicles = Chronicle::where('universe_id', $universeId)
            ->whereNotNull('content')
            ->where(function ($q) use ($fromTick, $toTick) {
                $q->whereBetween('from_tick', [$fromTick, $toTick])
                    ->orWhereBetween('to_tick', [$fromTick, $toTick]);
            })
            ->orderBy('from_tick')
            ->limit(self::MAX_CHRONICLES)
            ->get();

        if ($chronicles->isNotEmpty()) {
            $lines = [];
            foreach ($chronicles as $c) {
                $lines[] = "Tick {$c->from_tick}-{$c->to_tick} [{$c->type}]: " . (is_string($c->content) ? $c->content : ($c->raw_payload['description'] ?? json_encode($c->raw_payload ?? [])));
            }
            $parts[] = "CHRONICLES:\n" . implode("\n", array_slice($lines, 0, 80));
        }

        $eras = Era::where('universe_id', $universeId)
            ->where(function ($q) use ($fromTick, $toTick) {
                $q->whereBetween('start_tick', [$fromTick, $toTick])
                    ->orWhereBetween('end_tick', [$fromTick, $toTick]);
            })
            ->orderBy('start_tick')
            ->get();

        if ($eras->isNotEmpty()) {
            $lines = [];
            foreach ($eras as $e) {
                $lines[] = "Era {$e->start_tick}-{$e->end_tick}: {$e->title}" . ($e->summary ? " — {$e->summary}" : '');
            }
            $parts[] = "ERAS:\n" . implode("\n", $lines);
        }

        $civs = Civilization::where('universe_id', $universeId)
            ->where(function ($q) use ($fromTick, $toTick) {
                $q->whereBetween('origin_tick', [$fromTick, $toTick])
                    ->orWhereBetween('collapse_tick', [$fromTick, $toTick])
                    ->orWhere(function ($q2) use ($fromTick, $toTick) {
                        $q2->where('origin_tick', '<=', $fromTick)->where(function ($q3) use ($toTick) {
                            $q3->whereNull('collapse_tick')->orWhere('collapse_tick', '>=', $toTick);
                        });
                    });
            })
            ->get();

        foreach ($civs as $civ) {
            $hist = CivilizationHistory::where('civilization_id', $civ->id)->first();
            if ($hist) {
                $parts[] = "CIVILIZATION {$civ->name} (ticks {$civ->origin_tick}-" . ($civ->collapse_tick ?? 'ongoing') . "):\n"
                    . "Origin: " . ($hist->origin_story ?? '') . "\n"
                    . "Golden age: " . ($hist->golden_age_story ?? '') . "\n"
                    . "Collapse: " . ($hist->collapse_story ?? '');
            }
        }

        $religions = Religion::where('universe_id', $universeId)->get();
        if ($religions->isNotEmpty()) {
            $lines = [];
            foreach ($religions as $r) {
                $lines[] = "{$r->name}: " . ($r->doctrine ?? '');
            }
            $parts[] = "RELIGIONS:\n" . implode("\n", $lines);
        }

        $legends = Legend::where(function ($q) use ($universeId) {
            $q->whereHas('legendaryAgent', fn ($q2) => $q2->where('universe_id', $universeId))
                ->orWhereIn('actor_id', \App\Models\Actor::where('universe_id', $universeId)->pluck('id'));
        })->get();

        if ($legends->isNotEmpty()) {
            $lines = [];
            foreach ($legends->take(30) as $l) {
                $lines[] = "Legend (level {$l->legend_level}): {$l->title} — {$l->story}";
            }
            $parts[] = "LEGENDS:\n" . implode("\n", $lines);
        }

        return implode("\n\n", $parts);
    }
}
