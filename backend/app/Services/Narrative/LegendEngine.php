<?php

namespace App\Services\Narrative;

use App\Models\Actor;
use App\Models\Chronicle;
use App\Models\Legend;
use App\Models\LegendaryAgent;

/**
 * Builds legend (title + story) from actor/legendary agent achievements; computes power_score and legend_level.
 */
class LegendEngine
{
    protected const LEVEL_THRESHOLDS = [0 => 1, 3 => 2, 7 => 3, 15 => 4, 30 => 5];

    public function __construct(
        protected NarrativeGenerator $generator,
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Generate legend for an actor (by actor_id). Creates Legend record.
     */
    public function generateForActor(int $universeId, int $actorId): ?Legend
    {
        $chronicles = Chronicle::where('universe_id', $universeId)
            ->where('actor_id', $actorId)
            ->orderBy('from_tick')
            ->limit(100)
            ->get();

        $score = $this->computePowerScore($chronicles);
        $level = $this->scoreToLevel($score);
        $summary = $this->achievementSummary($chronicles);

        return $this->createLegend(null, $actorId, $universeId, $score, $level, $summary);
    }

    /**
     * Generate legend for a LegendaryAgent. Creates Legend record linked to legendary_agent_id.
     */
    public function generateForLegendaryAgent(LegendaryAgent $agent): ?Legend
    {
        $chronicles = Chronicle::where('universe_id', $agent->universe_id)
            ->where('actor_id', $agent->original_agent_id)
            ->orderBy('from_tick')
            ->limit(100)
            ->get();

        $score = $this->computePowerScore($chronicles);
        $level = $this->scoreToLevel($score);
        $summary = $this->achievementSummary($chronicles);

        return $this->createLegend($agent->id, $agent->original_agent_id, $agent->universe_id, $score, $level, $summary);
    }

    protected function computePowerScore(\Illuminate\Support\Collection $chronicles): float
    {
        $score = 0.0;
        foreach ($chronicles as $c) {
            $type = strtolower((string) $c->type);
            $imp = (float) ($c->importance ?? 0.3);
            if (str_contains($type, 'war') || str_contains($type, 'battle')) {
                $score += 1.5 + $imp;
            } elseif (str_contains($type, 'death') || str_contains($type, 'kill')) {
                $score += 0.5 + $imp * 0.5;
            } elseif (str_contains($type, 'anomaly') || str_contains($type, 'miracle')) {
                $score += 2.0 + $imp;
            } else {
                $score += $imp * 0.3;
            }
        }
        return min(50.0, $score);
    }

    protected function scoreToLevel(float $score): int
    {
        $level = 1;
        foreach (self::LEVEL_THRESHOLDS as $threshold => $lvl) {
            if ($score >= $threshold) {
                $level = $lvl;
            }
        }
        return min(5, $level);
    }

    protected function achievementSummary(\Illuminate\Support\Collection $chronicles): string
    {
        $parts = [];
        foreach ($chronicles->take(20) as $c) {
            $raw = $c->raw_payload ?? [];
            $desc = is_array($raw) ? ($raw['description'] ?? json_encode($raw)) : (string) $raw;
            $parts[] = "Tick {$c->from_tick} [{$c->type}]: {$desc}";
        }
        return implode("\n", $parts);
    }

    protected function createLegend(?int $legendaryAgentId, ?int $actorId, int $universeId, float $score, int $level, string $summary): ?Legend
    {
        $prompt = "Achievements summary:\n{$summary}\n\nPower score: {$score}, Legend level: {$level} (1=hero, 2=champion, 3=mythic hero, 4=demigod, 5=godlike). "
            . "Write a short legend title (e.g. 'The Slayer of Beasts') and a 1-2 sentence legend story. Reply with first line 'TITLE: <title>' and second line 'STORY: <story>'.";

        $cacheKey = 'legend:' . ($legendaryAgentId ?? 'actor_' . $actorId) . ':' . hash('sha256', $prompt);
        $raw = $this->cache?->get($cacheKey);
        if ($raw === null) {
            $raw = $this->generator->generate($prompt);
            if ($raw) {
                $this->cache?->put($cacheKey, $raw);
            }
        }
        $title = 'Hero';
        $story = '';
        if ($raw) {
            foreach (explode("\n", $raw) as $line) {
                $line = trim($line);
                if (stripos($line, 'TITLE:') === 0) {
                    $title = trim(substr($line, 6), " \t\n\r\0\x0B\"'");
                } elseif (stripos($line, 'STORY:') === 0) {
                    $story = trim(substr($line, 6), " \t\n\r\0\x0B\"'");
                }
            }
        }

        return Legend::create([
            'actor_id' => $actorId,
            'legendary_agent_id' => $legendaryAgentId,
            'title' => $title ?: 'Hero',
            'story' => $story ?: 'A figure of renown.',
            'power_score' => $score,
            'legend_level' => $level,
            'achievement_ids' => [],
        ]);
    }
}
