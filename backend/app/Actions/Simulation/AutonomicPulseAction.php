<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Services\Simulation\AutonomicDecisionEngine;
use Illuminate\Support\Facades\Log;

class AutonomicPulseAction
{
    public function __construct(
        protected AdvanceSimulationAction $advanceAction,
        protected AutonomicDecisionEngine $autonomicEngine,
        protected \App\Services\Simulation\CulturalDynamicsService $culturalService,
        protected \App\Services\Simulation\WorldAutonomicEngine $worldAutonomicEngine
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

            $activeUniverses = Universe::where('world_id', $world->id)
                ->where('status', 'active')
                ->get();

            foreach ($activeUniverses as $universe) {
                try {
                    Log::info("Pulse starting for Universe {$universe->id} (World: {$world->id})");
                    
                    // 1. Advance Simulation (triggers Event & all side-effects via Listeners)
                    $response = $this->advanceAction->execute($universe->id, $ticksPerPulse);
                    
                    if ($response['ok'] ?? false) {
                        $results[$universe->id] = 'success';
                    } else {
                        $results[$universe->id] = 'failed: ' . ($response['error'] ?? 'unknown');
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
