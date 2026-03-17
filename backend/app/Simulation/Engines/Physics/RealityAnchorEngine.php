<?php

namespace App\Simulation\Engines\Physics;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 58: Heroic Reality Anchors Engine (V8+) ⚓✨
 * 
 * Các Anh hùng (Heroic Actors) đóng vai trò là "Điểm neo thực tại", 
 * ổn định hóa cấu trúc thế giới và kháng lại Entropy.
 */
class RealityAnchorEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string
    {
        return 'reality_anchor';
    }

    public function phase(): string
    {
        return 'physical';
    }

    public function priority(): int
    {
        return 6;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $actors = $state->getActorEntities();
        $heroicCount = 0;
        $totalInfluence = 0.0;

        foreach ($actors as $actor) {
            if ($actor->isHeroic && $actor->isAlive) {
                $heroicCount++;
                // Ảnh hưởng tỷ lệ thuận với chỉ số influence của anh hùng
                $influence = (float)($actor->metrics['influence'] ?? 1.0);
                $totalInfluence += $influence;
            }
        }

        if ($heroicCount === 0) {
            return EngineResult::empty();
        }

        // Tính toán Cognitive Field Strength
        // Càng nhiều anh hùng, thực tại càng vững chắc (diminishing returns)
        $fieldStrength = log($totalInfluence + 1) * 0.05;

        // 1. Boost Stability Index
        $currentStability = $state->getStabilityIndex();
        $state->setStabilityIndex(min(1.0, $currentStability + $fieldStrength));

        // 2. Suppress Entropy
        $currentEntropy = $state->getEntropy();
        $entropySuppression = $fieldStrength * 0.5;
        $state->setEntropy(max(0.0, $currentEntropy - $entropySuppression));

        // 3. Mark in pressures for reasoning
        $pressures = $state->getPressures();
        $pressures['heroic_anchoring'] = $fieldStrength;
        $state->setPressures($pressures);

        Log::debug("RealityAnchorEngine: $heroicCount heroic anchors active. Field Strength: $fieldStrength");

        return EngineResult::empty();
    }
}
