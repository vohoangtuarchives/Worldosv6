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
        $transitionScore = $this->calculateTransitionScore($state);

        $phases = [
            'TRIBAL' => ['threshold' => 0.3, 'next' => 'CITY_STATE'],
            'CITY_STATE' => ['threshold' => 0.5, 'next' => 'KINGDOM'],
            'KINGDOM' => ['threshold' => 0.7, 'next' => 'EMPIRE'],
            'EMPIRE' => ['threshold' => 0.9, 'next' => 'INDUSTRIAL_STATE']
        ];

        if (isset($phases[$currentPhase])) {
            $config = $phases[$currentPhase];
            if ($transitionScore > $config['threshold']) {
                $state->set('meta.civilization_phase', $config['next']);
                Log::alert("PHASE TRANSITION: Civilization has ascended to {$config['next']}!", [
                    'tick' => $ctx->getTick(),
                    'score' => $transitionScore
                ]);
                
                // Kích hoạt các hiệu ứng đặc biệt (Entropy spike khi chuyển pha)
                $state->set('entropy', (float)$state->get('entropy', 0) + 0.1);
            }
        }

        return new EngineResult([], [], []);
    }

    private function calculateTransitionScore(WorldState $state): float
    {
        $pop = (float)$state->get('fields.population', 0.1);
        $tech = (float)$state->get('fields.knowledge', 0.1);
        $inst = (float)$state->get('meta.institution_monolithicity', 0.1);

        // Điểm chuyển pha dựa trên quy mô dân số, tri thức và độ vững chắc của định chế
        return ($pop * 0.4) + ($tech * 0.3) + ($inst * 0.3);
    }
}
