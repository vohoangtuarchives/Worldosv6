<?php

namespace App\Services\Narrative;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Support\Facades\Log;

/**
 * V10+ Vector 3: Narrative Chapter Engine — Autopilot 🎭📖
 *
 * "Mỗi 100 ticks, vũ trụ tự viết một chương mới về câu chuyện của mình."
 *
 * Tự động phát hiện:
 *  - Chapter boundaries (khi arc đạt đỉnh/đáy)
 *  - Protagonist (actor đang có arc hero mạnh nhất)
 *  - Dramatic peak detection (crisis + high entropy swing)
 */
class NarrativeChapterEngine
{
    private const CHAPTER_INTERVAL_TICKS = 100;
    private const CRISIS_ENTROPY_THRESHOLD = 0.75;
    private const PROTAGONIST_HEROISM_THRESHOLD = 3;

    public function __construct(
        protected NarrativeAiService $narrativeAi
    ) {}

    /**
     * Main entry — called each tick from MetaCosmicStage or SimulationTickPipeline.
     */
    public function runWithState(WorldState $state, int $tick): void
    {
        $universeId = (int) $state->get('universe_id', 0);

        // ── 1. Chapter Boundary Detection ──
        $lastChapterTick = (int) $state->get('meta.last_chapter_tick', 0);
        $ticksSinceChapter = $tick - $lastChapterTick;

        $isDramaticPeak = $this->detectDramaticPeak($state);
        $isChapterBoundary = $ticksSinceChapter >= self::CHAPTER_INTERVAL_TICKS;
        $isEarlyPeak = $isDramaticPeak && $ticksSinceChapter >= 30;

        if ($isChapterBoundary || $isEarlyPeak) {
            $this->triggerChapter($state, $universeId, $tick, $lastChapterTick, $isDramaticPeak);
        }

        // ── 2. Protagonist Tracking ──
        $this->trackProtagonist($state);
    }

    /**
     * Detect if the simulation is at a narrative peak (crisis or triumph).
     */
    private function detectDramaticPeak(WorldState $state): bool
    {
        $entropy = (float) $state->get('entropy', 0.0);
        $stability = (float) $state->get('stability_index', 1.0);
        $coalitionForming = (bool) $state->get('meta.coalition_forming', false);
        $transcendence = $state->getActiveAttractor() === 'TRANSCENDENCE';
        $revolutionPending = (bool) $state->get('meta.revolution_flag', false);

        // Crisis peak: high entropy + low stability
        if ($entropy > self::CRISIS_ENTROPY_THRESHOLD && $stability < 0.3) {
            return true;
        }

        // Triumph peak: transcendence reached
        if ($transcendence) {
            return true;
        }

        // Social upheaval
        if ($coalitionForming || $revolutionPending) {
            return true;
        }

        return false;
    }

    /**
     * Trigger a narrative chapter generation.
     */
    private function triggerChapter(
        WorldState $state,
        int $universeId,
        int $tick,
        int $lastChapterTick,
        bool $isDramaticPeak
    ): void {
        $fromTick = $lastChapterTick;
        $toTick = $tick;

        // Mark chapter opened
        $state->set('meta.last_chapter_tick', $tick);
        $state->set('meta.current_chapter_index', (int) $state->get('meta.current_chapter_index', 0) + 1);
        $state->set('meta.chapter_is_dramatic', $isDramaticPeak);

        // Context enrichment for AI
        $protagonist = $state->get('meta.current_protagonist', null);
        $attractor   = $state->getActiveAttractor();
        $entropy     = round((float) $state->get('entropy', 0.0), 3);

        Log::info("NarrativeChapterEngine: Chapter {$state->get('meta.current_chapter_index')} triggered.", [
            'universe_id'  => $universeId,
            'tick'         => $tick,
            'from'         => $fromTick,
            'dramatic'     => $isDramaticPeak,
            'protagonist'  => $protagonist['name'] ?? 'unknown',
            'attractor'    => $attractor,
        ]);

        // Async chronicle generation — fire and forget (let NarrativeAiService handle persistence)
        try {
            $this->narrativeAi->generateChronicle($universeId, $fromTick, $toTick, 'auto_chronicle');
        } catch (\Throwable $e) {
            Log::warning("NarrativeChapterEngine: Chronicle generation failed: {$e->getMessage()}");
        }
    }

    /**
     * Update protagonist tracking — find the actor with strongest "heroic arc".
     * Uses meta data already computed by other engines, not DB queries.
     */
    private function trackProtagonist(WorldState $state): void
    {
        $actors = $state->get('meta.heroic_actors', []);
        if (empty($actors)) {
            return;
        }

        // Find top actor by arc strength (legend_level + is_heroic score)
        $top = null;
        $topScore = -1;

        foreach ($actors as $actor) {
            $score = (int) ($actor['legend_level'] ?? 0) + ((bool) ($actor['is_heroic'] ?? false) ? 3 : 0);
            if ($score > $topScore) {
                $topScore = $score;
                $top = $actor;
            }
        }

        if ($top && $topScore >= self::PROTAGONIST_HEROISM_THRESHOLD) {
            $state->set('meta.current_protagonist', $top);
        }
    }
}
