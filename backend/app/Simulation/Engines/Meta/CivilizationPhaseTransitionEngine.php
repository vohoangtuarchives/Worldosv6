<?php

namespace App\Simulation\Engines\Meta;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 71: Civilization Phase Transition Engine 🏛️🚀
 * 
 * Mô phỏng các bước nhảy cấu trúc (Phase Transitions).
 * Tribes -> Kingdoms -> Empires -> Planetary Civilization.
 */
class CivilizationPhaseTransitionEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string
    {
        return 'civilization_phase_transition';
    }

    public function phase(): string
    {
        return 'meta';
    }

    public function priority(): int
    {
        return 71;
    }

    public function tickRate(): int
    {
        return 20; // Thường chạy mỗi 20 ticks
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $currentPhase = $state->get('meta.civilization_phase', 'TRIBAL');
        $transitionScore = $this->calculateTransitionScore($state, $ctx);

        $phases = [
            'TRIBAL' => ['threshold' => 0.3, 'next' => 'CITY_STATE', 'requires_material' => 'Bronze'],
            'CITY_STATE' => ['threshold' => 0.5, 'next' => 'KINGDOM', 'requires_material' => 'Iron'],
            'KINGDOM' => ['threshold' => 0.7, 'next' => 'EMPIRE', 'requires_material' => 'Steel'],
            'EMPIRE' => ['threshold' => 0.9, 'next' => 'INDUSTRIAL_STATE', 'requires_material' => 'Silicon']
        ];

        if (isset($phases[$currentPhase])) {
            $config = $phases[$currentPhase];
            
            // Phase 12: Axiom-driven transitions
            // Check if required material is ACTIVE in this universe
            $hasMaterial = $this->checkMaterialMastery($ctx->getUniverseId(), $config['requires_material']);
            
            if ($transitionScore > $config['threshold'] && $hasMaterial) {
                $state->set('meta.civilization_phase', $config['next']);
                Log::alert("PHASE TRANSITION: Civilization has ascended to {$config['next']}!", [
                    'tick' => $ctx->getTick(),
                    'score' => $transitionScore,
                    'material' => $config['requires_material']
                ]);
                
                // Kích hoạt các hiệu ứng đặc biệt (Entropy spike khi chuyển pha)
                $state->set('entropy', (float)$state->get('entropy', 0) + 0.15);
            }
        }

        return new EngineResult([], [], []);
    }

    private function calculateTransitionScore(WorldState $state, TickContext $ctx): float
    {
        $pop = (float)$state->get('fields.population', 0.1);
        $tech = (float)$state->get('fields.knowledge', 0.1);
        $inst = (float)$state->get('meta.institution_monolithicity', 0.1);
        
        // Physics 2.0: Energy surplus acts as a multiplier for transition
        $netEnergy = (float)$state->get('net_energy', 0.0);
        $energyMultiplier = 1.0 + max(0, $netEnergy * 0.5);

        // Điểm chuyển pha dựa trên quy mô dân số, tri thức và độ vững chắc của định chế
        return (($pop * 0.4) + ($tech * 0.3) + ($inst * 0.3)) * $energyMultiplier;
    }

    private function checkMaterialMastery(int $universeId, string $materialName): bool
    {
        return \App\Models\MaterialInstance::where('universe_id', $universeId)
            ->whereHas('material', fn($q) => $q->where('name', $materialName))
            ->where('lifecycle', \App\Models\Material::LIFECYCLE_ACTIVE)
            ->exists();
    }
}
