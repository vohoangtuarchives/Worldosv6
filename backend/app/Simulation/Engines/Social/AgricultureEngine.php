<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use function resource_path;
use function file_get_contents;
use function app;

/**
 * doc §6.3: Agriculture Engine stub. food_production, food_required, famine, tech stages.
 */
final class AgricultureEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        private ?RuleVmService $ruleVm = null
    ) {
        $this->ruleVm = $this->ruleVm ?? \app(RuleVmService::class);
    }

    public function phase(): string
    {
        return 'economy';
    }

    public function name(): string
    {
        return 'agriculture';
    }

    public function priority(): int
    {
        return 11;
    }

    public function tickRate(): int
    {
        return 1;
    }


    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $dslFile = \resource_path('worldos_rules/biology/biosphere.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $vec = $state->getStateVector();
        
        $rawState = [
            'tech_level' => (float) ($vec['tech_level'] ?? 0.1),
            'land_area' => (float) ($vec['land_area'] ?? 1000),
            'population' => (float) ($vec['population'] ?? 100),
            'ecological_stability' => (float) ($vec['ecology']['stability'] ?? 0.8),
            'random_chance' => lcg_value(),
            'instability_score' => (float) ($vec['instability_score'] ?? 0.0),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        $events = [];
        if ($result['ok'] ?? false) {
            foreach ($result['outputs'] ?? [] as $out) {
                if (($out['event_name'] ?? '') === 'FAMINE_OUTBREAK') {
                    $events[] = WorldEvent::create(
                        WorldEventType::FAMINE,
                        $ctx->getUniverseId(),
                        $ctx->getTick(),
                        null,
                        [],
                        $out['metadata']['intensity'] ?? 0.5
                    );
                }
            }
        }

        return new EngineResult($events, [], []);
    }
}



