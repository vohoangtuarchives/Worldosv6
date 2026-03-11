<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * EventNarrativeService: Translates raw mathematical payloads into storytelling via AI (§V27).
 * Delegates to NarrativeEngine (single-chronicle path). For batched processing use NarrativeEngine::generateBatched.
 */
class EventNarrativeService
{
    public function __construct(
        protected NarrativeEngine $engine
    ) {}

    /**
     * Process a single chronicle (1 chronicle → 1 LLM call). Uses NarrativeEngine for prompt + strategy + cache.
     */
    public function generateNarrativeForChronicle(Chronicle $chronicle): void
    {
        $this->engine->generateForChronicle($chronicle);
    }
}
