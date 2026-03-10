<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\HistoricalFact;
use App\Models\Universe;
use App\Contracts\LlmNarrativeClientInterface;
use App\Services\Simulation\HistoryEngine;
use Illuminate\Support\Facades\Log;

/**
 * AI Historian Agent (Narrative v2).
 *
 * Reads Historical Fact + Memory Graph + Actor Story to generate
 * history volumes, essays, and philosophy treatises via LLM.
 */
class HistorianAgentService
{
    public function __construct(
        protected HistoryEngine $historyEngine,
        protected HistoricalFactEngine $historicalFactEngine,
        protected NarrativeMemoryGraphService $memoryGraph,
        protected ActorStoryEngine $actorStoryEngine,
        protected ?LlmNarrativeClientInterface $llmClient = null,
    ) {
        if ($this->llmClient === null && app()->bound(LlmNarrativeClientInterface::class)) {
            $this->llmClient = app(LlmNarrativeClientInterface::class);
        }
    }

    /**
     * Generate a history volume or essay for a universe (tick range).
     *
     * @param  array{from_tick?: int, to_tick?: int, theme?: string, actor_id?: int}  $criteria
     */
    public function generateHistory(Universe $universe, string $outputType = 'history_volume', array $criteria = []): ?Chronicle
    {
        $fromTick = $criteria['from_tick'] ?? 0;
        $toTick = $criteria['to_tick'] ?? null;
        if ($toTick === null) {
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $toTick = $latest ? (int) $latest->tick : (int) $universe->current_tick;
        }
        $theme = $criteria['theme'] ?? 'general';
        $actorId = $criteria['actor_id'] ?? null;

        $facts = HistoricalFact::where('universe_id', $universe->id)
            ->whereBetween('tick', [$fromTick, $toTick])
            ->orderBy('tick')
            ->limit(100)
            ->get();

        $timeline = $this->historyEngine->getTimeline($universe, 80);

        $actorContext = '';
        if ($actorId !== null) {
            $actor = \App\Models\Actor::find($actorId);
            if ($actor !== null) {
                $life = $this->actorStoryEngine->buildLifeHistory($actor);
                $actorContext = "\nActor focus (id={$actorId}): birth_tick={$life->birthTick}, death_tick=" . ($life->deathTick ?? 'null')
                    . ", major_events=" . json_encode(array_slice($life->majorEvents, 0, 15))
                    . ", artifact_ids=" . json_encode($life->artifactIds)
                    . ", institution_ids=" . json_encode($life->institutionIds);
            }
        }

        $prompt = $this->buildPrompt($universe, $facts, $timeline, $fromTick, $toTick, $theme, $outputType, $actorContext);

        $content = $this->llmClient?->generate($prompt);
        if ($content === null || trim($content) === '') {
            $content = $this->fallbackSummary($facts, $timeline, $fromTick, $toTick);
        }

        return Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $fromTick,
            'to_tick' => $toTick,
            'type' => $outputType,
            'content' => trim($content),
            'raw_payload' => [
                'action' => 'historian_generated',
                'criteria' => $criteria,
                'theme' => $theme,
            ],
        ]);
    }

    private function buildPrompt(
        Universe $universe,
        $facts,
        array $timeline,
        int $fromTick,
        int $toTick,
        string $theme,
        string $outputType,
        string $actorContext
    ): string {
        $factLines = $facts->map(fn (HistoricalFact $f) => sprintf(
            'Tick %d (Year %s): %s | metrics=%s | events=%s',
            $f->tick,
            $f->year ?? '?',
            $f->category,
            json_encode($f->metrics_after ?? []),
            json_encode($f->facts ?? [])
        ))->implode("\n");

        $timelinePreview = array_slice($timeline, 0, 30);
        $timelineText = implode("\n", array_map(fn ($e) => sprintf(
            '[%s–%s] %s: %s',
            $e['from_tick'] ?? '?',
            $e['to_tick'] ?? '?',
            $e['type'] ?? 'event',
            substr($e['content'] ?? json_encode($e['payload'] ?? []), 0, 200)
        ), $timelinePreview));

        $instruction = $outputType === 'philosophy_treatise'
            ? 'Viết một đoạn triết luận ngắn (philosophy treatise) dựa trên các sự kiện và metrics trên.'
            : 'Viết một bản tóm tắt lịch sử (history volume / essay) dựa trên các fact và timeline trên. Ngôn ngữ: Tiếng Việt.';

        return <<<EOT
Bạn là AI Historian của WorldOS. Nhiệm vụ: {$instruction}

Universe: {$universe->name} (id={$universe->id})
Khoảng tick: {$fromTick} – {$toTick}
Chủ đề: {$theme}
{$actorContext}

## Historical facts (Layer 2)
{$factLines}

## Timeline (chronicles)
{$timelineText}

Chỉ dựa vào dữ liệu trên, không bịa thêm. Output ngắn gọn, có cấu trúc.
EOT;
    }

    private function fallbackSummary($facts, array $timeline, int $fromTick, int $toTick): string
    {
        $lines = ["Period {$fromTick}–{$toTick}. Facts: " . $facts->count() . ". Timeline entries: " . count($timeline) . "."];
        foreach ($facts->take(10) as $f) {
            $lines[] = "Tick {$f->tick}: {$f->category} – " . json_encode($f->facts ?? []);
        }

        return implode("\n", $lines);
    }
}
