<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\UniverseSimulationPulsed;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class GenerateNarrative implements ShouldQueue
{
    public function __construct(
        protected NarrativeAiService $narrativeAi
    ) {}

    public function handle(UniverseSimulationPulsed $event): void
    {
        $universe = $event->universe;
        $snapshot = $event->snapshot;
        
        // We need to know previous tick to generate chronicle for the range
        // Since AdvanceSimulationAction updates current_tick AFTER firing (if we follow order), 
        // we might need to be careful. In the new world, we fire after engine returns.
        
        // For now, let's assume we want to generate chronicle for the ticks just simulated.
        // The engine response tells us how many ticks were processed if we pass it, 
        // or we can just use the difference.
        
        // Logic: engine processed $ticks. universe->current_tick was X, snapshot->tick is X + $ticks.
        // In the refactored Action, we'll fire event BEFORE updating universe->current_tick in DB.
        
        $fromTick = (int)$universe->current_tick;
        $toTick = (int)$snapshot->tick;

        if ($toTick > $fromTick) {
            try {
                $this->narrativeAi->generateChronicle($universe->id, $fromTick, $toTick, 'chronicle');
            } catch (\Throwable $e) {
                Log::error("Narrative generation failed in listener: " . $e->getMessage());
            }
        }
    }
}
