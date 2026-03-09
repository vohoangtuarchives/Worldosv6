<?php

namespace App\Modules\Simulation\Services;

use App\Models\Chronicle;
use App\Models\Universe;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Support\Facades\Log;

/**
 * Mythology Generator Engine (Phase F): turns timeline/chronicles into mythology-style narrative.
 * Produces Chronicle with type 'myth' for a universe over a tick range.
 */
class MythologyGeneratorEngine
{
    public function __construct(
        protected NarrativeAiService $narrativeAi,
        protected CivilizationMemoryEngine $civilizationMemory
    ) {}

    /**
     * Generate a mythology chronicle for the universe over the given tick range.
     * Uses NarrativeAiService with type 'myth'; optional civilization memory enriches context.
     */
    public function generateFromUniverse(Universe $universe, ?int $fromTick = null, ?int $toTick = null): ?Chronicle
    {
        $fromTick = $fromTick ?? 0;
        if ($toTick === null) {
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $toTick = $latest ? (int) $latest->tick : (int) ($universe->current_tick ?? 0);
        }

        if ($toTick < $fromTick) {
            Log::warning("MythologyGeneratorEngine: invalid range universe_id={$universe->id} from={$fromTick} to={$toTick}");
            return null;
        }

        $type = (string) config('worldos.mythology_generator.chronicle_type', 'myth');

        try {
            return $this->narrativeAi->generateChronicle($universe->id, $fromTick, $toTick, $type);
        } catch (\Throwable $e) {
            Log::error("MythologyGeneratorEngine: generateFromUniverse failed universe_id={$universe->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Return civilization memory for the universe in range (convenience for callers that need both).
     */
    public function getMemoryForUniverse(Universe $universe, ?int $fromTick = null, ?int $toTick = null): array
    {
        return $this->civilizationMemory->getMemory($universe, $fromTick, $toTick);
    }
}
