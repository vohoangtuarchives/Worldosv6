<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 62: Multiverse Causal Bridge Engine (V8+) 🌉⚛️
 * 
 * Quản lý việc dịch chuyển (Translocation) các thực thể và mật độ trường 
 * lực giữa các dòng thời gian dựa trên độ cộng hưởng (Resonance).
 */
class CausalBridgeEngine
{
    protected \App\Contracts\UniverseSimilarityServiceInterface $similarityService;

    public function __construct(\App\Contracts\UniverseSimilarityServiceInterface $similarityService)
    {
        $this->similarityService = $similarityService;
    }

    public function runWithState(WorldState $state, int $tick): void
    {
        $neighbors = $state->getNeighboringRealities();
        if (empty($neighbors)) return;

        $resonanceThreshold = 0.9;
        $activeBridges = [];

        foreach ($neighbors as $neighbor) {
            $resonance = (float)($neighbor['similarity_score'] ?? 0.0);
            
            if ($resonance > $resonanceThreshold) {
                $bridgeId = $neighbor['universe_id'];
                $activeBridges[$bridgeId] = [
                    'resonance' => $resonance,
                    'stability' => $state->getStabilityIndex(),
                    'flow_rate' => ($resonance - $resonanceThreshold) * 10.0
                ];
                
                Log::info("CausalBridgeEngine: Causal gateway opened with Universe $bridgeId. Resonance: $resonance");
            }
        }

        if (!empty($activeBridges)) {
            $state->set('meta.active_causal_bridges', $activeBridges);
            
            // Xử lý DSL quy tắc bắc cầu
            $this->processBridgeRules($state, $tick);
        }
    }

    protected function processBridgeRules(WorldState $state, int $tick): void
    {
        // DSL rules for bridges will be called via RuleVmService in RuleStage
        // This engine primarily setups the bridge context in WorldState.
    }
}
