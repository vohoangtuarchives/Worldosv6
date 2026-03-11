<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;

/**
 * Single responsibility: persist narrative content to Chronicle (and optional embedding/cache).
 */
class ChronicleWriter
{
    public function __construct(
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Write content to a single chronicle. Optionally use cache when hash matches.
     */
    public function write(Chronicle $chronicle, string $content): void
    {
        $chronicle->content = $content;
        $chronicle->save();
    }

    /**
     * Write the same aggregated content to multiple chronicles (e.g. one LLM call → N chronicles get same summary).
     *
     * @param  array<int, Chronicle>  $chronicles
     */
    public function writeToMany(array $chronicles, string $content): void
    {
        foreach ($chronicles as $c) {
            $c->content = $content;
            $c->save();
        }
    }
}
