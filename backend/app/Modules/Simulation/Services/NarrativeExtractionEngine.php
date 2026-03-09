<?php

namespace App\Modules\Simulation\Services;

use App\Models\Chronicle;
use App\Models\Saga;
use App\Models\Universe;
use App\Models\World;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Narrative Extraction Engine (Phase D): turns timeline (universe history) into story/lore.
 * Uses TimelineSelectionEngine to pick best timelines, then NarrativeAiService to generate
 * consolidated lore chronicles. No legacy code; clean integration.
 */
class NarrativeExtractionEngine
{
    public function __construct(
        protected TimelineSelectionEngine $timelineSelection,
        protected NarrativeAiService $narrativeAi
    ) {}

    /**
     * Extract a single lore/story chronicle for one universe over a tick range.
     * If range is null, uses 0 to latest snapshot (or current_tick).
     */
    public function extractLore(Universe $universe, ?int $fromTick = null, ?int $toTick = null): ?Chronicle
    {
        $fromTick = $fromTick ?? 0;
        if ($toTick === null) {
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $toTick = $latest ? (int) $latest->tick : (int) ($universe->current_tick ?? 0);
        }

        if ($toTick < $fromTick) {
            Log::warning("NarrativeExtractionEngine: invalid range universe_id={$universe->id} from={$fromTick} to={$toTick}");
            return null;
        }

        $type = (string) config('worldos.narrative_extraction.chronicle_type', 'lore');

        try {
            return $this->narrativeAi->generateChronicle($universe->id, $fromTick, $toTick, $type);
        } catch (\Throwable $e) {
            Log::error("NarrativeExtractionEngine: extractLore failed universe_id={$universe->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Select best timelines for the world, then extract lore for each.
     * Returns collection of Chronicles (nulls filtered out).
     */
    public function extractBestFromWorld(World $world, ?int $limit = null): Collection
    {
        $limit = $limit ?? (int) config('worldos.narrative_extraction.default_limit', 5);
        $universes = $this->timelineSelection->selectBest($world, $limit);

        return $this->extractLoreForUniverses($universes);
    }

    /**
     * Select best timelines for the saga, then extract lore for each.
     * Returns collection of Chronicles (nulls filtered out).
     */
    public function extractBestFromSaga(Saga $saga, ?int $limit = null): Collection
    {
        $limit = $limit ?? (int) config('worldos.narrative_extraction.default_limit', 5);
        $universes = $this->timelineSelection->selectBestForSaga($saga, $limit);

        return $this->extractLoreForUniverses($universes);
    }

    /**
     * @param  Collection<int, Universe>  $universes
     * @return Collection<int, Chronicle>
     */
    protected function extractLoreForUniverses(Collection $universes): Collection
    {
        $chronicles = collect();
        foreach ($universes as $universe) {
            $chronicle = $this->extractLore($universe);
            if ($chronicle !== null) {
                $chronicles->push($chronicle);
            }
        }
        return $chronicles;
    }
}
