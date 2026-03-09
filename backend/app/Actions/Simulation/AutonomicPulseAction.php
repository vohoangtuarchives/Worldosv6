<?php

namespace App\Actions\Simulation;

use Illuminate\Support\Facades\Log;

class AutonomicPulseAction
{
    public function __construct(
        protected AdvanceSimulationAction $advanceAction,
        protected \App\Modules\Simulation\Services\WorldRegulatorEngine $worldAutonomicEngine,
        protected \App\Modules\Simulation\Services\MultiverseSchedulerEngine $scheduler
    ) {}

    /**
     * Chạy một nhịp xung (Pulse) cho toàn bộ hệ thống.
     */
    public function execute(int $ticksPerPulse = 10): array
    {
        $activeWorlds = \App\Models\World::where('is_autonomic', true)->get();
        $results = [];

        foreach ($activeWorlds as $world) {
            // World-level Autonomic Adjustment (Axiom shifts)
            $this->worldAutonomicEngine->process($world);

            $tickBudget = (int) config('worldos.scheduler.tick_budget', 0);
            $activeUniverses = $this->scheduler->schedule($world, $tickBudget);

            foreach ($activeUniverses as $universe) {
                try {
                    Log::info("Pulse starting for Universe {$universe->id} (World: {$world->id})");
                    
                    // 1. Advance Simulation (triggers Event & all side-effects via Listeners)
                    $response = $this->advanceAction->execute($universe->id, $ticksPerPulse);
                    
                    if ($response['ok'] ?? false) {
                        $results[$universe->id] = 'success';
                    } else {
                        $results[$universe->id] = 'failed: ' . ($response['error_message'] ?? $response['error'] ?? 'unknown');
                    }
                } catch (\Throwable $e) {
                    Log::error("Pulse error for Universe {$universe->id}: " . $e->getMessage());
                    $results[$universe->id] = 'error';
                }
            }
        }

        $completedCount = count(array_filter($results, fn($r) => $r === 'success'));
        Log::info("Autonomic Pulse Cycle Completed. Worlds: " . $activeWorlds->count() . ", Success: {$completedCount}");

        return $results;
    }
}
