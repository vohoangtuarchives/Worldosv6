<?php

namespace App\Services\Narrative;

use App\Contracts\LlmNarrativeClientInterface;
use App\Models\AgentConfig;
use Illuminate\Support\Facades\Log;

/**
 * Single responsibility: call LLM to generate text from prompt.
 * No chronicle, no prompt building — just generate(prompt) -> string.
 */
class NarrativeGenerator
{
    public function __construct(
        protected ?NarrativeAiService $narrativeAi = null,
        protected ?LlmNarrativeClientInterface $llmClient = null
    ) {
        if ($this->narrativeAi === null && app()->bound(NarrativeAiService::class)) {
            $this->narrativeAi = app(NarrativeAiService::class);
        }
        if ($this->llmClient === null && app()->bound(LlmNarrativeClientInterface::class)) {
            $this->llmClient = app(LlmNarrativeClientInterface::class);
        }
    }

    /**
     * Generate narrative text from prompt. Prefer NarrativeAiService::generateSnippet when available.
     */
    public function generate(string $prompt): ?string
    {
        if ($this->narrativeAi !== null) {
            return $this->narrativeAi->generateSnippet($prompt);
        }
        if ($this->llmClient?->isAvailable()) {
            return $this->llmClient->generate($prompt);
        }
        Log::warning('NarrativeGenerator: No LLM client available, returning null.');
        return null;
    }
}
