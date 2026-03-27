<?php

namespace App\Modules\Narrative\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * NarrativeLoomService: Laravel Client for the Python NarrativeLoom (LangGraph) microservice.
 */
class NarrativeLoomService
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.loom.url', 'http://narrative_loom:8001'), '/');
        $this->timeout = (int) config('services.loom.timeout', 600);
    }

    /**
     * Weave multiple chronicles into a single high-quality prose via LangGraph agents.
     */
    public function weave(int $worldId, ?int $tickStart = null, ?int $tickEnd = null): array
    {
        $world = \App\Models\World::find($worldId);
        $genre = $world ? ($world->current_genre ?? $world->base_genre) : 'generic';

        // Fetch high-virality narratives from OTHER universes as whispers
        $whispers = \App\Models\Narrative::where('is_active', true)
            ->where('universe_id', '!=', $world->universes()->first()?->id)
            ->where('virality', '>', 0.7)
            ->limit(3)
            ->pluck('story')
            ->toArray();

        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout($this->timeout)->post("{$this->baseUrl}/weave-chronicles", [
                'world_id' => $worldId,
                'tick_start' => $tickStart,
                'tick_end' => $tickEnd,
                'genre' => $genre,
                'whispers' => $whispers,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("NarrativeLoom: weave failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } catch (\Throwable $e) {
            Log::error("NarrativeLoom: weave exception: " . $e->getMessage());
        }

        return ['ok' => false, 'error' => 'NarrativeLoom communication failed'];
    }

    /**
     * Get real-time AI decision/intent for a specific actor.
     */
    public function getActorIntent(array $requestData): array
    {
        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout(30)->post("{$this->baseUrl}/actor-intent", $requestData);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Throwable $e) {
            Log::warning("NarrativeLoom: actor-intent failed: " . $e->getMessage());
        }

        return ['ok' => false, 'error' => 'Loom actor-intent unavailable'];
    }
}
