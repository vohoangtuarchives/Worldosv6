<?php

namespace App\Services\Narrative\Contracts;

/**
 * Strategy for building narrative prompt by event action type.
 * Replaces switch-case; each action type has its own strategy.
 */
interface NarrativeStrategyInterface
{
    /**
     * Whether this strategy handles the given action.
     */
    public function supports(string $action): bool;

    /**
     * Build prompt for (possibly aggregated) payload. Payload may contain:
     * - action, counts, samples, tick, universe context, etc.
     *
     * @param  array<string, mixed>  $payload
     */
    public function buildPrompt(array $payload): string;
}
