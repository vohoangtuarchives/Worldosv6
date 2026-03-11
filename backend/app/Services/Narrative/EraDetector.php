<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\Era;
use App\Models\HistoricalFact;
use App\Models\Universe;

/**
 * Detects era transitions from chronicles/historical_facts in a tick range.
 * Creates Era records with title; summary is filled by EraNarrativeEngine.
 */
class EraDetector
{
    public function __construct(
        protected int $minTicksForEra = 50,
        protected float $entropyThresholdForCollapse = 0.75,
        protected int $warCountThreshold = 2
    ) {
        $this->minTicksForEra = max(10, (int) (config('worldos.narrative.era_interval', 200) / 2));
    }

    /**
     * Detect if there was an era in the given range and create an Era record with title (summary=null).
     *
     * @return Era|null
     */
    public function detectAndCreate(Universe $universe, int $startTick, int $endTick): ?Era
    {
        if ($endTick - $startTick < $this->minTicksForEra) {
            return null;
        }

        $chronicles = Chronicle::where('universe_id', $universe->id)
            ->whereBetween('from_tick', [$startTick, $endTick])
            ->orWhereBetween('to_tick', [$startTick, $endTick])
            ->limit(500)
            ->get();

        $facts = HistoricalFact::where('universe_id', $universe->id)
            ->whereBetween('tick', [$startTick, $endTick])
            ->get();

        $title = $this->deriveTitle($chronicles, $facts, $startTick, $endTick);

        return Era::create([
            'universe_id' => $universe->id,
            'start_tick' => $startTick,
            'end_tick' => $endTick,
            'title' => $title,
            'summary' => null,
            'detected_at_tick' => $endTick,
        ]);
    }

    protected function deriveTitle($chronicles, $facts, int $startTick, int $endTick): string
    {
        $categories = $facts->pluck('category')->filter()->unique()->values()->all();
        $hasCollapse = $facts->contains(fn ($f) => ($f->metrics_after['entropy'] ?? 0) >= $this->entropyThresholdForCollapse);
        $warCount = $chronicles->filter(fn ($c) => in_array($c->raw_payload['action'] ?? '', ['war_started', 'war_ended'], true))->count();

        if ($hasCollapse && $warCount >= $this->warCountThreshold) {
            return 'Age of Collapse and War';
        }
        if ($hasCollapse) {
            return 'Age of Collapse';
        }
        if ($warCount >= $this->warCountThreshold) {
            return 'Age of War';
        }
        if (!empty($categories)) {
            return 'Age of ' . ucfirst((string) $categories[0]);
        }

        return "Era {$startTick}-{$endTick}";
    }
}
