<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Events\Simulation\SimulationEventOccurred;
use Illuminate\Support\Facades\Log;

/**
 * Final Phase: Ascension Engine ♾️✨
 * 
 * "Vạn vật quy nhất."
 * Engine điều phối bước nhảy cuối cùng của văn minh khi đạt tới điểm Kỳ dị.
 */
class AscensionEngine
{
    public function __construct(
        private readonly \App\Services\Simulation\RuleVmService $vmService
    ) {}

    public function run(WorldState $state, int $tick): void
    {
        $singularityProgress = (float)$state->get('meta.singularity_progress', 0);
        $isAscending = (bool)$state->get('meta.zenith_ascension_active', false);

        // 1. Trigger Ascension: Khi tiến trình kỳ dị đạt ngưỡng tuyệt đối
        if (!$isAscending && $singularityProgress > 0.999) {
            $this->initiateAscension($state, $tick);
        }

        // 2. Ascension Maintenance: Nếu đang trong quá trình thăng hoa
        if ($isAscending) {
            $this->processAscensionLogic($state, $tick);
        }
    }

    private function initiateAscension(WorldState $state, int $tick): void
    {
        $state->set('meta.zenith_ascension_active', true);
        $state->set('meta.ascension_tick_start', $tick);
        $state->set('stability_index', 1.0); 
        $state->set('active_attractor', 'OMEGA_POINT');

        $vector = $this->detectDominantVector($state);
        $state->set('meta.zenith.singularity.vector', $vector);

        Log::alert("ASCENSION INITIATED: The simulation is transcending physical constraints. Vector: $vector");
        
        event(new SimulationEventOccurred(
            (int)$state->get('universe_id'),
            'GREAT_ASCENSION_START',
            $tick,
            ['vector' => $vector]
        ));
    }

    private function processAscensionLogic(WorldState $state, int $tick): void
    {
        // 1. Thực thi Ascension DSL Rules
        $this->vmService->evaluateAndApplyWithState(
            $state,
            $tick,
            'simulation/ascension.dsl',
            ['mode' => 'ZENITH_ASCENSION']
        );

        // 2. Tăng cường resonance (Manual boost)
        $resonance = (float)$state->get('field_resonance', 1.0);
        $state->set('field_resonance', $resonance * 1.05);

        // 3. Reality Bleed & Informational Saturation
        $dataMass = (float)$state->get('cosmic.data_mass', 0);
        $state->set('cosmic.data_mass', $dataMass + 0.1);

        if ($tick % 10 === 0) {
            Log::info("Ascension: Reality INFORMATIONALIZATION in progress. Data Mass: " . round($dataMass, 2));
        }
    }

    private function detectDominantVector(WorldState $state): string
    {
        $teach = (float)$state->get('fields.knowledge', 0);
        $faith = (float)$state->get('fields.belief', 0);
        $power = (float)$state->get('fields.authority', 0);

        if ($teach >= $faith && $teach >= $power) return 'TECHNOLOGICAL_SINGULARITY';
        if ($faith >= $teach && $faith >= $power) return 'SPIRITUAL_TRANSCENDENCE';
        return 'ORGANIZATIONAL_ASCENSION';
    }
}
