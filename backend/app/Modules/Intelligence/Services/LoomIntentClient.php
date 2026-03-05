<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Domain\Policy\IntentResponse;
use App\Modules\Intelligence\Domain\Policy\UniverseContext;
use App\Modules\Intelligence\Entities\ActorEntity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP client that calls narrative-loom /actor-intent.
 * Hard timeout of 3 seconds — MUST fallback to DecisionEngine on failure.
 */
class LoomIntentClient
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(
            config('services.narrative_loom.url', env('NARRATIVE_LOOM_URL', 'http://narrative_loom:8001')),
            '/'
        );
    }

    /**
     * Request LLM intent for an actor.
     * Returns null on timeout, error, or low confidence.
     */
    public function requestIntent(ActorEntity $actor, UniverseContext $ctx): ?IntentResponse
    {
        $traits = $this->buildTraitMap($actor);

        try {
            $response = Http::timeout(120)
                ->post("{$this->baseUrl}/actor-intent", [
                    'actor_id'          => $actor->id,
                    'actor_name'        => $actor->name,
                    'archetype'         => $actor->archetype,
                    'traits'            => $traits,
                    'universe_context'  => [
                        'entropy'         => $ctx->entropy,
                        'stability_index' => $ctx->stabilityIndex,
                        'myth_intensity'  => $ctx->mythIntensity,
                        'tick'            => $ctx->tick,
                    ],
                    'recent_biography'  => $this->extractRecentBio($actor),
                    'available_actions' => [
                        'revolt', 'form_contract', 'migrate',
                        'trade', 'suppress_revolt', 'propagate_myth',
                    ],
                    // Local Ollama default — can be overridden via config
                    'provider'   => config('services.narrative_loom.provider', 'local'),
                    'model_name' => config('services.narrative_loom.model', 'qwen/qwen3.5-9b'),
                ]);

            if ($response->failed()) {
                Log::debug("[LoomIntentClient] HTTP {$response->status()} for actor {$actor->id}: " . $response->body());
                return null;
            }

            $data = $response->json();
            Log::debug("[LoomIntentClient] Response for actor {$actor->id}: " . json_encode($data));
            $intent = IntentResponse::fromArray($data);
            return $intent->isReliable() ? $intent : null;

        } catch (\Throwable $e) {
            Log::debug("[LoomIntentClient] Timeout/error for actor {$actor->id}: {$e->getMessage()}");
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildTraitMap(ActorEntity $actor): array
    {
        $dimensions = ActorEntity::TRAIT_DIMENSIONS;
        $map = [];
        foreach ($dimensions as $i => $name) {
            $map[$name] = round((float) ($actor->traits[$i] ?? 0.5), 3);
        }
        return $map;
    }

    private function extractRecentBio(ActorEntity $actor): string
    {
        if (!$actor->biography) {
            return '';
        }
        $lines = array_filter(explode("\n", $actor->biography));
        $recent = array_slice($lines, -5); // last 5 biography entries
        return implode("\n", $recent);
    }
}
