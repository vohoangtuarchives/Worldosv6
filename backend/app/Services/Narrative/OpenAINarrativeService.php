<?php

namespace App\Services\Narrative;

use App\Contracts\LlmNarrativeClientInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OpenAI (or OpenAI-compatible) LLM adapter for narrative generation.
 * Configure via OPENAI_API_KEY and NARRATIVE_LLM_MODEL or worldos.narrative.
 */
class OpenAINarrativeService implements LlmNarrativeClientInterface
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = (string) (config('worldos.narrative.openai_api_key') ?? config('services.openai.key') ?? '');
        $this->model = (string) (config('worldos.narrative.model') ?? config('services.openai.model') ?? 'gpt-4o');
        $this->baseUrl = rtrim((string) (config('worldos.narrative.base_url') ?? 'https://api.openai.com'), '/');
        $this->timeout = (int) (config('worldos.narrative.timeout') ?? 120);
    }

    public function isAvailable(): bool
    {
        return $this->apiKey !== '';
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        if (!$this->isAvailable()) {
            return null;
        }

        $model = $options['model'] ?? $this->model;
        $system = $options['system'] ?? 'Bạn là WorldOS, người kể chuyện về sự tiến hóa của vũ trụ. Phản hồi bằng tiếng Việt.';
        $temperature = isset($options['temperature']) ? (float) $options['temperature'] : 0.7;

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout($this->timeout)
                ->post($this->baseUrl . '/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => $temperature,
                ]);

            if ($response->successful()) {
                return trim((string) ($response->json('choices.0.message.content') ?? ''));
            }
            Log::warning('OpenAI narrative response not successful', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::error('OpenAI narrative error: ' . $e->getMessage());
        }

        return null;
    }
}
