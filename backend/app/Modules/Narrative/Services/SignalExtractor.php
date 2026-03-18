<?php

namespace App\Modules\Narrative\Services;

use Illuminate\Support\Facades\Log;

/**
 * SignalExtractor: Parses LLM output to extract actionable simulation signals.
 * Enforces a structured format for AI feedback loops.
 */
class SignalExtractor
{
    /**
     * @param string $llmResponse Raw text from LLM (expected to contain JSON)
     * @return array{omens: array, impacts: array, events: array, chronicle: string}
     */
    public function extract(string $llmResponse): array
    {
        // Try to extract JSON between backticks if present
        if (preg_match('/```json(.*?)```/s', $llmResponse, $matches)) {
            $json = trim($matches[1]);
        } else {
            $json = trim($llmResponse);
        }

        $decoded = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning("SignalExtractor: Invalid JSON received from LLM. Falling back to empty signals.");
            return $this->emptySignals($llmResponse);
        }

        return [
            'omens'     => $decoded['omens'] ?? [],
            'impacts'   => $decoded['impacts'] ?? [],
            'events'    => $decoded['events'] ?? [],
            'chronicle' => $decoded['chronicle'] ?? ($decoded['text'] ?? $llmResponse)
        ];
    }

    protected function emptySignals(string $originalContent): array
    {
        return [
            'omens'     => [],
            'impacts'   => [],
            'events'    => [],
            'chronicle' => $originalContent
        ];
    }
}
