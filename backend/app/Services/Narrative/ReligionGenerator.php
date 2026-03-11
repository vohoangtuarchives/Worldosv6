<?php

namespace App\Services\Narrative;

use App\Models\Myth;
use App\Models\Religion;

/**
 * Turns a myth (religion seed) into a Religion via LLM: name + doctrine.
 */
class ReligionGenerator
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
     * Generate religion from myth story; create Religion record.
     */
    public function generateFromMyth(Myth $myth): ?Religion
    {
        $story = $myth->story ?? '';
        if ($story === '') {
            return null;
        }

        $prompt = "From this myth/story, extract a religion name and a short doctrine (1-3 sentences). "
            . "Reply in exactly two lines: first line 'NAME: <name>', second line 'DOCTRINE: <text>'.\n\nStory:\n{$story}";

        $cacheKey = 'religion_from_myth:' . $myth->id . ':' . hash('sha256', $prompt);
        $raw = $this->cache?->get($cacheKey);
        if ($raw === null) {
            $raw = $this->generator->generate($prompt);
            if ($raw) {
                $this->cache?->put($cacheKey, $raw);
            }
        }
        if (!$raw) {
            return null;
        }

        $name = 'Unknown Faith';
        $doctrine = '';
        foreach (explode("\n", $raw) as $line) {
            $line = trim($line);
            if (stripos($line, 'NAME:') === 0) {
                $name = trim(substr($line, 5), " \t\n\r\0\x0B\"'");
            } elseif (stripos($line, 'DOCTRINE:') === 0) {
                $doctrine = trim(substr($line, 9), " \t\n\r\0\x0B\"'");
            }
        }

        return Religion::create([
            'universe_id' => $myth->universe_id,
            'name' => $name ?: 'Unknown Faith',
            'origin_myth_id' => $myth->id,
            'doctrine' => $doctrine ?: $story,
            'spread_rate' => 0.1,
            'followers' => 0,
        ]);
    }
}
